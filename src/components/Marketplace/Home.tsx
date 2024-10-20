/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

import { ArrowRight, Search } from "lucide-react";
import { useFetchMarketItems } from '../../hooks/Marketplace/useFetchMarketItems';
import CustomImage from '../ui/CustomImage';
import { useCreateMarketSale } from '../../hooks/Marketplace/useCreateMarketSale';
import { toast } from 'react-hot-toast';
import { formatEther } from 'viem';
import UserNFTs from './UserNFTs';
import { useUserCollections } from '../../hooks/Marketplace/useUserCollections';

export default function Home() {
  const { marketItems, isLoading, error: fetchError } = useFetchMarketItems(0);
  const [nftMetadata, setNftMetadata] = useState<{ [key: string]: any }>({});
  const { handleCreateMarketSale, isBuying, isSuccess } = useCreateMarketSale();
  const [selectedNFT, setSelectedNFT] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [showUserNFTs, setShowUserNFTs] = useState(false);
  const [collectionNames, setCollectionNames] = useState<{ [key: string]: string }>({});

  // Usar el hook useUserCollections
  const userCollections = useUserCollections(marketItems);

  useEffect(() => {
    const names: { [key: string]: string } = {};
    userCollections.forEach(collection => {
      names[collection.contractAddress.toLowerCase()] = collection.name;
    });
    setCollectionNames(names);
  }, [userCollections]);

  useEffect(() => {
    const fetchMetadata = async () => {
      const metadata: { [key: string]: any } = {};
      const names: { [key: string]: string } = {};
      for (const item of marketItems) {
        if (item.tokenId) {
          try {
            const response = await fetch(`/api/nft-metadata?tokenId=${item.tokenId.toString()}&contractAddress=${item.nftContractAddress}`);
            const data = await response.json();
            metadata[item.marketItemId.toString()] = data;
            
            // Obtener el nombre de la colección
            if (!names[item.nftContractAddress]) {
              const collectionResponse = await fetch(`/api/collection-info?contractAddress=${item.nftContractAddress}`);
              const collectionData = await collectionResponse.json();
              names[item.nftContractAddress] = collectionData.name || 'Colección Desconocida';
            }
          } catch (error) {
            console.error('Error al obtener metadatos:', error);
          }
        }
      }
      setNftMetadata(metadata);
      setCollectionNames(names);
    };

    if (marketItems.length > 0) {
      fetchMetadata();
    }
  }, [marketItems]);

  const handleBuy = async (marketItem: any) => {
    try {
      await handleCreateMarketSale(
        BigInt(marketItem.marketItemId),
        marketItem.nftContractAddress as `0x${string}`,
        BigInt(marketItem.tokenId),
        BigInt(marketItem.price)
      );
      if (isSuccess) {
        toast.success('NFT comprado con éxito');
        // Aquí puedes actualizar la lista de NFTs o redirigir al usuario
      }
    } catch (error) {
      console.error('Error al comprar el NFT:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error desconocido al comprar el NFT');
      }
    }
  };

  const sortedMarketItems = [...marketItems].sort((a, b) => Number(b.marketItemId) - Number(a.marketItemId));

  const handleOpenDialog = (item: any) => {
    setSelectedNFT({ ...item, metadata: nftMetadata[item.marketItemId.toString()] });
    setIsDialogOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setShowUserNFTs(true);
    }
  };

  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                Descubre, Compra y Vende NFTs Únicos
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                Explora nuestra colección de NFTs y encuentra piezas únicas para tu colección digital.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <form className="flex space-x-2" onSubmit={handleSearch}>
                <Input
                  className="max-w-lg flex-1 bg-white text-black"
                  placeholder="Buscar por dirección de wallet"
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                />
                <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Buscar</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {showUserNFTs ? (
        <UserNFTs userAddress={searchAddress} />
      ) : (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Últimos Listados</h2>
            {isLoading ? (
              <p>Cargando...</p>
            ) : fetchError ? (
              <p>Error al cargar los items: {fetchError.message}</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedMarketItems.slice(0, 8).map((item) => {
                  const metadata = nftMetadata[item.marketItemId.toString()];
                  const collectionName = collectionNames[item.nftContractAddress] || 'Colección Desconocida';
                  return (
                    <Card key={item.marketItemId.toString()} className="overflow-hidden">
                      <CardHeader className="p-0">
                        <div
                          className="aspect-square relative cursor-pointer w-full h-0 pb-[100%]"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <CustomImage
                            alt={`NFT ${item.tokenId.toString()}`}
                            src={metadata?.imageurl || "/placeholder.png"}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="absolute top-0 left-0 w-full h-full"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <CardTitle>{metadata?.name || `NFT #${item.tokenId.toString()}`}</CardTitle>
                        <p className="text-sm text-muted-foreground">{collectionName}</p>
                        <p className="text-sm text-muted-foreground">Precio: {formatEther(BigInt(item.price))} ETH</p>
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-2">
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => handleBuy(item)}
                          disabled={isBuying}
                        >
                          {isBuying ? 'Comprando...' : `Comprar por ${formatEther(BigInt(item.price))} ETH`}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
            <div className="mt-12 text-center">
              <Button>
                Ver más <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNFT?.metadata?.name || `NFT #${selectedNFT?.tokenId.toString()}`}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="w-full h-auto">
              <CustomImage
                alt={`NFT ${selectedNFT?.tokenId.toString()}`}
                src={selectedNFT?.metadata?.imageurl || "/placeholder.png"}
                width={500}
                height={500}
                layout="responsive"
              />
            </div>
            <p className="mt-2">{selectedNFT?.metadata?.description}</p>
            <p className="mt-2">Precio: {formatEther(BigInt(selectedNFT?.price || 0))} ETH</p>
            <p>ID del Token: {selectedNFT?.tokenId.toString()}</p>
            <p>Dirección del Contrato: {selectedNFT?.nftContractAddress}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
