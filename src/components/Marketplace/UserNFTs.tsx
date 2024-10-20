import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import CustomImage from '../ui/CustomImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useCreateMarketSale } from '../../hooks/Marketplace/useCreateMarketSale';
import { toast } from 'react-hot-toast';
import { formatEther } from 'viem';
import { Loader2, ChevronDown, ChevronUp, X, Search, RefreshCw } from "lucide-react";
import { Input } from "../ui/input";
import { NFT } from '../../types/types';
import { useUpdateEmptyTokenURIs } from '../../hooks/useUpdateEmptyTokenURIs';
import { Address, Avatar, Name, Identity, Badge } from '@coinbase/onchainkit/identity';
import Image from 'next/image';
import { isAddress } from 'viem';

interface UserNFTsProps {
  userAddress: string;
}

const formatAddress = (address: string | undefined): `0x${string}` | undefined => {
  return address && isAddress(address) ? address as `0x${string}` : undefined;
}

const UserNFTs: React.FC<UserNFTsProps> = ({ userAddress }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { handleCreateMarketSale, isBuying, isSuccess } = useCreateMarketSale();
  const [isCollectionsMenuOpen, setIsCollectionsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const { updateEmptyTokenURIs, isUpdating } = useUpdateEmptyTokenURIs();

  const fetchUserNFTs = useCallback(async () => {
    if (!userAddress) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/collected-nfts?userAddress=${userAddress}`);
      const data = await response.json();
      console.log('Datos recibidos de la API:', data);
      setNfts(data.nfts.map((nft: NFT) => {
        console.log('NFT individual:', nft);
        return {
          ...nft,
          isListed: nft.marketItemId !== null && nft.marketItemId !== undefined
        };
      }));
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Error al cargar los NFTs');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs]);

  const handleBuy = async (nft: NFT) => {
    if (!nft.marketItemId || !nft.contractAddress || !nft.tokenId || !nft.listedPrice) {
      toast.error('Información del NFT incompleta');
      return;
    }
    try {
      await handleCreateMarketSale(
        BigInt(nft.marketItemId),
        nft.contractAddress as `0x${string}`,
        BigInt(nft.tokenId),
        BigInt(nft.listedPrice)
      );
      if (isSuccess) {
        toast.success('NFT comprado con éxito');
        fetchUserNFTs();
      }
    } catch (error) {
      console.error('Error al comprar el NFT:', error);
      toast.error('Error al comprar el NFT');
    }
  };

  const handleOpenDialog = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsDialogOpen(true);
  };

  const userCollections = useMemo(() => {
    console.log('NFTs para procesar colecciones:', nfts);
    const collections: { [key: string]: { name: string, items: number, thumbnail: string, contractAddress: string } } = {};
    nfts.forEach(nft => {
      if (nft.contractAddress) {
        if (!collections[nft.contractAddress]) {
          collections[nft.contractAddress] = {
            name: nft.collectionName || 'Colección Desconocida',
            items: 0,
            thumbnail: nft.image || '/placeholder.svg',
            contractAddress: nft.contractAddress
          };
        }
        collections[nft.contractAddress].items++;
        // Actualizar el nombre de la colección si está disponible
        if (nft.collectionName) {
          collections[nft.contractAddress].name = nft.collectionName;
        }
      }
    });
    console.log('Colecciones procesadas:', collections);
    return Object.values(collections);
  }, [nfts]);

  const sortedCollections = useMemo(() => {
    return [...userCollections].sort((a, b) => {
      if (a.items === 0 && b.items === 0) return 0;
      if (a.items === 0) return 1;
      if (b.items === 0) return -1;
      return b.items - a.items;
    });
  }, [userCollections]);

  const filteredCollections = useMemo(() => {
    return sortedCollections.filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedCollections, searchTerm]);

  const sortedNFTs = useMemo(() => {
    if (!selectedCollection) {
      return nfts;
    }
    return [...nfts].sort((a, b) => {
      if (a.contractAddress === selectedCollection && b.contractAddress !== selectedCollection) {
        return -1;
      }
      if (a.contractAddress !== selectedCollection && b.contractAddress === selectedCollection) {
        return 1;
      }
      return 0;
    });
  }, [nfts, selectedCollection]);

  const handleCollectionClick = (contractAddress: string) => {
    setSelectedCollection(contractAddress);
    setIsCollectionsMenuOpen(false);
  };

  const handleUpdateTokenURI = async () => {
    try {
      console.log(`Iniciando actualización de nombres y tokenURIs para NFTs con nombre vacío`);
      await updateEmptyTokenURIs();
      console.log(`Actualización de nombres y tokenURIs completada`);
      await fetchUserNFTs();
      console.log(`Lista de NFTs actualizada después de la actualización`);
    } catch (error) {
      console.error('Error al actualizar nombres y tokenURIs:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-i">
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
            address={formatAddress(userAddress)}
            className="w-32 h-32 rounded-full border-4 border-background"
          />
          <div className="mt-4 sm:mt-0 sm:ml-4 mb-2">
            <Identity
              address={formatAddress(userAddress) || '0x0000000000000000000000000000000000000000'}
              schemaId="0x8d2d6cc5c0f8b3cb29b6e9f5c0c70b39a0c88a7c0e3f5d0d92f1f5e3c64c1a0b"
            >
              <Name className="text-2xl font-bold">
                <Badge />
              </Name>
              <Address
                className="text-sm text-muted-foreground"
              />
            </Identity>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row mt-6">
          <div className="w-full lg:w-56 xl:w-64 mb-6 lg:mb-0 lg:pr-4">
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setIsCollectionsMenuOpen(!isCollectionsMenuOpen)}
                className="w-full flex justify-between items-center rounded-xl"
                variant="outline"
              >
                <span>Colecciones</span>
                {isCollectionsMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </Button>
            </div>

            <div
              ref={menuRef}
              className={`
                lg:block
                ${isCollectionsMenuOpen ? 'fixed inset-0 z-50 bg-background p-4' : 'hidden'}
                lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0
              `}
            >
              <div className="flex justify-between items-center mb-4 lg:hidden">
                <h3 className="font-semibold">Colecciones</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollectionsMenuOpen(false)}
                >
                  <X size={24} />
                </Button>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  type="text"
                  placeholder="Buscar colecciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-xl"
                />
              </div>
              <div className="flex justify-between items-center mb-2">
                {selectedCollection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCollection(null);
                      setIsCollectionsMenuOpen(false);
                    }}
                    className="text-sm rounded-lg"
                  >
                    Limpiar selección
                  </Button>
                )}
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-11rem)] lg:max-h-none">
                {filteredCollections.map((collection, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 bg-secondary rounded-xl cursor-pointer ${
                      selectedCollection === collection.contractAddress ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => handleCollectionClick(collection.contractAddress)}
                  >
                    <div className="w-12 h-12 mr-3 relative">
                      <CustomImage
                        src={collection.thumbnail}
                        alt={collection.name}
                        fill
                        sizes="48px"
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{collection.name}</p>
                      <p className="text-sm text-muted-foreground">{collection.items} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">NFTs de {userAddress}</h2>
              <Button
                onClick={handleUpdateTokenURI}
                disabled={isUpdating}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>{isUpdating ? 'Actualizando...' : 'Actualizar metadatos'}</span>
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                {sortedNFTs.map((nft, i) => (
                  <Card key={nft.id || i} className="overflow-hidden">
                    <div
                      className="aspect-square relative cursor-pointer"
                      onClick={() => handleOpenDialog(nft)}
                    >
                      <CustomImage
                        alt={`NFT ${nft.name || i}`}
                        src={nft.image || "/placeholder.svg"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <CardContent className="p-2">
                      <h4 className="text-sm font-medium truncate">{nft.name || `NFT #${nft.tokenId || i}`}</h4>
                      <div className="flex justify-end mt-2">
                        {nft.isListed && (
                          <Button variant="outline" size="sm" onClick={() => handleBuy(nft)} disabled={isBuying}>
                            {isBuying ? 'Comprando...' : `Comprar por ${formatEther(BigInt(nft.listedPrice || '0'))} ETH`}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNFT?.name || 'Detalles del NFT'}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedNFT && (
              <>
                <div className="w-full h-auto aspect-square relative">
                  <CustomImage
                    alt={`NFT ${selectedNFT.name || selectedNFT.tokenId}`}
                    src={selectedNFT.image || "/placeholder.svg"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p className="mt-2">{selectedNFT.description}</p>
                <p className="mt-2">ID del Token: {selectedNFT.tokenId}</p>
                <p>Dirección del Contrato: {selectedNFT.contractAddress}</p>
                {selectedNFT.isListed && (
                  <p className="mt-2">Precio listado: {formatEther(BigInt(selectedNFT.listedPrice || '0'))} ETH</p>
                )}
                {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Atributos:</h4>
                    <ul className="list-disc list-inside">
                      {selectedNFT.attributes.map((attr, index) => (
                        <li key={index}>{attr.trait_type}: {attr.value}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserNFTs;
