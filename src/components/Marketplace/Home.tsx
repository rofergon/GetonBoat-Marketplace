/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

import { ArrowRight, Search } from "lucide-react";
import { useFetchMarketItems } from '../../hooks/useFetchMarketItems';
import CustomImage from '../pixelminter/CustomImage';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

export default function Home() {
  const { marketItems, isLoading, error } = useFetchMarketItems(0); // Obtener la primera página
  const [nftMetadata, setNftMetadata] = useState<{ [key: string]: any }>({});

  const weiToEth = (weiAmount: bigint): string => {
    return ethers.utils.formatEther(weiAmount);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      const metadata: { [key: string]: any } = {};
      for (const item of marketItems) {
        if (item.tokenId) {
          try {
            // Cambiamos la URL para incluir la dirección del contrato
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

  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Descubre, colecciona y vende NFTs extraordinarios
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Explora el mundo de los NFTs. Compra, vende y colecciona obras de arte digitales únicas en nuestro marketplace.
              </p>
              <p className="text-2xl font-semibold mt-4">
                Get on Board. Get on Base. Get on Boat.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <form className="flex space-x-2">
                <Input className="max-w-lg flex-1" placeholder="Buscar colecciones, artistas o NFTs" type="text" />
                <Button type="submit" variant="outline">
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
          ) : error ? (
            <p>Error al cargar los items: {error.message}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {marketItems.slice(0, 8).map((item) => {
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
                      <p className="text-sm text-muted-foreground">Precio: {weiToEth(item.price)} ETH</p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Ver detalles</Button>
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