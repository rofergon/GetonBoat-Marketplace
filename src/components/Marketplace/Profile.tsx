import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAccount } from 'wagmi';
import { Address, Avatar } from '@coinbase/onchainkit/identity';
import CustomImage from '../pixelminter/CustomImage';
import Image from 'next/image';

interface NFT {
  id?: string;
  name?: string;
  tokenId?: string;
  image?: string;
  description?: string;
  tokenURI?: string;
  attributes?: { trait_type: string; value: string }[];
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
  // Añade más colecciones simuladas aquí
];

export default function Profile() {
  const [collectedNFTs, setCollectedNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNFT(null);
    setIsModalOpen(false);
  };

  const handleListNFT = (nft: NFT) => {
    // Aquí puedes implementar la lógica para listar el NFT
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
    </div>
  );
}