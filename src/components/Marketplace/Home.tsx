/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

import { ArrowRight, Search } from "lucide-react";
import { useFetchMarketItems } from '../../hooks/useFetchMarketItems';
import CustomImage from '../pixelminter/CustomImage';
import { useCreateMarketSale } from '../../hooks/useCreateMarketSale';
import { toast } from 'react-hot-toast';
import { parseEther, formatEther } from 'viem';

export default function Home() {
  const { marketItems, isLoading, error: fetchError } = useFetchMarketItems(0);
  const [nftMetadata, setNftMetadata] = useState<{ [key: string]: any }>({});
  const { handleCreateMarketSale, isBuying, isSuccess, error: buyError } = useCreateMarketSale();

  useEffect(() => {
    const fetchMetadata = async () => {
      const metadata: { [key: string]: any } = {};
      for (const item of marketItems) {
        if (item.tokenId) {
          try {
            const response = await fetch(`/api/nft-metadata?tokenId=${item.tokenId.toString()}&contractAddress=${item.nftContractAddress}`);
            const data = await response.json();
            metadata[item.marketItemId.toString()] = data;
          } catch (error) {
            console.error('Error al obtener metadatos:', error);
          }
        }
      }
      setNftMetadata(metadata);
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
              <form className="flex space-x-2">
                <Input className="max-w-lg flex-1 bg-white text-black" placeholder="Buscar NFTs" type="text" />
                <Button type="submit" className="bg-white text-black hover:bg-gray-200">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Buscar</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
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
                return (
                  <Card key={item.marketItemId.toString()}>
                    <CardHeader>
                      <div className="aspect-square relative">
                        <CustomImage
                          alt={`NFT ${item.tokenId.toString()}`}
                          src={metadata?.imageurl || "/placeholder.png"}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle>{metadata?.name || `NFT #${item.tokenId.toString()}`}</CardTitle>
                      <p className="text-sm text-muted-foreground">Precio: {formatEther(BigInt(item.price))} ETH</p>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                      <Button className="w-full">Ver detalles</Button>
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
    </>
  );
}
