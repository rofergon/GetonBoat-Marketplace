import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAccount } from 'wagmi';
import { Address, Avatar } from '@coinbase/onchainkit/identity';
import CustomImage from '../pixelminter/CustomImage';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusLabel, TransactionStatusAction } from '@coinbase/onchainkit/transaction';
import type { LifeCycleStatus } from '@coinbase/onchainkit/transaction';
import { Abi } from 'viem';
import { useNFTListing } from '../../hooks/useNFTListing';

interface NFT {
  id?: string;
  name?: string;
  tokenId?: string;
  image?: string;
  description?: string;
  tokenURI?: string;
  attributes?: { trait_type: string; value: string }[];
  contractAddress?: string;
}

interface Collection {
  name: string;
  items: number;
  floorPrice: string;
}

const mockCollections: Collection[] = [
  { name: "BasePaint", items: 15421, floorPrice: "0.0021 ETH" },
  { name: "Infected Rats", items: 1, floorPrice: "3.98 ETH" },
  { name: "BASE MonkeGodz", items: 4, floorPrice: "0.5 ETH" },
  { name: "SimpPunks", items: 10000, floorPrice: "0.01 ETH" },
];

const MARKETPLACE_ADDRESS = '0x960f887ddf97d872878e6fa7c25d7a059f8fb6d7';

export default function Profile() {
  const [collectedNFTs, setCollectedNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [listingNFT, setListingNFT] = useState<NFT | null>(null);
  const [listingPrice, setListingPrice] = useState<string>('');

  const {
    isApproved,
    approvalTxHash,
    listingTxHash,
    error,
    handleApprovalStatus,
    handleListingStatus,
    getApprovalContract,
    getListingContract,
  } = useNFTListing(listingNFT?.contractAddress as `0x${string}`, listingNFT?.tokenId || '');

  const fetchCollectedNFTs = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/collected-nfts?userAddress=${address}`);
      const data = await response.json();
      setCollectedNFTs(data.nfts || []);
    } catch (error) {
      console.error('Error al obtener NFTs coleccionados:', error);
      setCollectedNFTs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchCollectedNFTs();
    }
  }, [address]);

  const handleViewDetails = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsDialogOpen(true);
  };

  const handleListNFT = (nft: NFT) => {
    setListingNFT(nft);
    setIsDialogOpen(true);
  };

  const handleConfirmListing = () => {
    if (!listingNFT || !listingPrice) return;
    setIsDialogOpen(false);
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="relative w-full h-48">
        <Image
          alt="Banner de perfil"
          src="/placeholder.svg?height=192&width=1024&text=Banner"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 -mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-end mb-6">
          <Avatar
            address={address || undefined}
            className="w-32 h-32 rounded-full border-4 border-background"
          />
          <div className="mt-4 sm:mt-0 sm:ml-4 mb-2">
            <h2 className="text-2xl font-bold">Unnamed</h2>
            <Address 
              address={address || '0x0'} 
              className="text-sm text-muted-foreground" 
            />
            <div className="mt-1">
              <span className="text-sm">Joined April 2022</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="collected" className="w-full">
          <TabsList className="w-full justify-start border-b overflow-x-auto">
            <TabsTrigger value="collected">Collected 4.7K</TabsTrigger>
            <TabsTrigger value="created">Created</TabsTrigger>
            <TabsTrigger value="favorited">Favorited 505</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="more">More</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col lg:flex-row mt-6">
            <div className="w-full lg:w-56 xl:w-64 mb-6 lg:mb-0 lg:pr-4">
              <h3 className="font-semibold mb-2">Collections</h3>
              <div className="space-y-2">
                {mockCollections.map((collection, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium">{collection.name}</p>
                      <p className="text-sm text-muted-foreground">{collection.items} items</p>
                    </div>
                    <p className="text-sm">{collection.floorPrice}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <TabsContent value="collected">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                  {collectedNFTs.map((nft, i) => (
                    <Card key={nft.id || i} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <CustomImage
                          alt={`NFT ${nft.name || i}`}
                          src={nft.image || "/placeholder.svg"}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <CardContent className="p-2">
                        <h4 className="text-sm font-medium truncate">{nft.name || `NFT #${nft.tokenId || i}`}</h4>
                        <div className="flex justify-between mt-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(nft)}>Details</Button>
                          <Button variant="outline" size="sm" onClick={() => handleListNFT(nft)}>List</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              {/* Otros TabsContent para created, favorited, etc. */}
            </div>
          </div>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{listingNFT?.name || 'List NFT'}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {listingNFT && (
              <>
                <img src={listingNFT.image} alt={listingNFT.name} className="w-full h-auto" />
                <input
                  type="text"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(e.target.value)}
                  placeholder="Enter listing price in wei"
                  className="mt-2 w-full p-2 border rounded"
                />
                {!isApproved ? (
                  <Transaction
                    chainId={8453}
                    contracts={getApprovalContract()}
                    onStatus={handleApprovalStatus}
                  >
                    <TransactionButton
                      text="Approve NFT"
                      className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    />
                    <TransactionStatus>
                      <TransactionStatusLabel className="text-gray-300" />
                      <TransactionStatusAction className="text-blue-500" />
                    </TransactionStatus>
                  </Transaction>
                ) : (
                  <Transaction
                    chainId={8453}
                    contracts={getListingContract(listingPrice)}
                    onStatus={handleListingStatus}
                  >
                    <TransactionButton
                      text="List NFT"
                      className="mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                    />
                    <TransactionStatus>
                      <TransactionStatusLabel className="text-gray-300" />
                      <TransactionStatusAction className="text-blue-500" />
                    </TransactionStatus>
                  </Transaction>
                )}
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {approvalTxHash && (
                  <p className="text-sm text-gray-600 mt-2">
                    Approval Transaction: <Address address={approvalTxHash as `0x${string}`} />
                  </p>
                )}
                {listingTxHash && (
                  <p className="text-sm text-gray-600 mt-2">
                    Listing Transaction: <Address address={listingTxHash as `0x${string}`} />
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}