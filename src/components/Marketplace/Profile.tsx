import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Copy, ExternalLink, MessageCircle, Share2 } from "lucide-react";
import { Address } from '@coinbase/onchainkit/identity';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

const DEFAULT_IMAGE = '/path/to/default-nft-image.jpg';

interface NFT {
  id?: string;
  name?: string;
  tokenId?: string;
  image?: string;
  description?: string;
  tokenURI?: string;
  attributes?: { trait_type: string; value: string }[];
}

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="relative">
              <img
                alt="Banner de perfil"
                className="absolute inset-0 w-full h-32 object-cover rounded-t-lg"
                height="128"
                src="/placeholder.svg?height=128&width=384&text=Banner"
                style={{
                  aspectRatio: "384/128",
                  objectFit: "cover",
                }}
                width="384"
              />
              <img
                alt="Avatar del usuario"
                className="relative w-24 h-24 rounded-full border-4 border-background mt-16"
                height="96"
                src="/placeholder.svg?height=96&width=96&text=Avatar"
                style={{
                  aspectRatio: "96/96",
                  objectFit: "cover",
                }}
                width="96"
              />
            </CardHeader>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-bold">CryptoArtista</h2>
              <p className="text-sm text-muted-foreground">@cryptoartista</p>
              <div className="flex items-center mt-2 space-x-2">
                <Button size="sm" variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensaje
                </Button>
                <Button size="icon" variant="outline">
                  <Share2 className="w-4 h-4" />
                  <span className="sr-only">Compartir perfil</span>
                </Button>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Bio</h3>
                <p className="text-sm mt-1">
                  Artista digital especializado en arte generativo y NFTs. Explorando los límites entre la tecnología y la creatividad.
                </p>
              </div>
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <div>
                  <span className="font-bold">10k</span> Seguidores
                </div>
                <div>
                  <span className="font-bold">5k</span> Siguiendo
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold">Dirección de la billetera</h3>
                <div className="flex items-center mt-1">
                  {address && (
                    <Address 
                      address={address} 
                      className="text-[var(--text-ock-foreground-muted)]" 
                    />
                  )}
                  <Button size="icon" variant="ghost" className="ml-2">
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Copiar dirección de la billetera</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Tabs defaultValue="creados" onValueChange={(value) => {
            if (value === 'coleccionados') {
              fetchCollectedNFTs();
            }
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="creados">Creados</TabsTrigger>
              <TabsTrigger value="coleccionados">Coleccionados</TabsTrigger>
              <TabsTrigger value="actividad">Actividad</TabsTrigger>
            </TabsList>
            <TabsContent value="creados" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-0">
                      <img
                        alt={`NFT creado #${i + 1}`}
                        className="w-full h-48 object-cover rounded-t-lg"
                        height="192"
                        src={`/placeholder.svg?height=192&width=256&text=NFT+${i + 1}`}
                        style={{
                          aspectRatio: "256/192",
                          objectFit: "cover",
                        }}
                        width="256"
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg">NFT Creado #{i + 1}</CardTitle>
                      <p className="text-sm text-muted-foreground">Precio: 0.5 ETH</p>
                      <Button className="w-full mt-2" size="sm">
                        Ver detalles
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="coleccionados" className="mt-6">
              {isLoading ? (
                <p>Cargando NFTs coleccionados...</p>
              ) : collectedNFTs.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {collectedNFTs.map((nft, i) => (
                    <Card key={nft.id || i}>
                      <CardHeader className="p-0">
                        <Image
                          alt={`NFT coleccionado ${nft.name || i}`}
                          className="w-full h-48 object-cover rounded-t-lg"
                          height={192}
                          width={256}
                          src={nft.image || DEFAULT_IMAGE}
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardTitle className="text-lg">{nft.name || `NFT #${nft.tokenId || i}`}</CardTitle>
                        <p className="text-sm text-muted-foreground">ID: {nft.tokenId || 'N/A'}</p>
                        <Button className="w-full mt-2" size="sm" onClick={() => handleViewDetails(nft)}>
                          Ver detalles
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No se encontraron NFTs coleccionados.</p>
              )}
            </TabsContent>
            <TabsContent value="actividad" className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <ul className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <li key={i} className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <ExternalLink className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {i % 2 === 0 ? "Vendió" : "Compró"} NFT #{i + 1}
                          </p>
                          <p className="text-xs text-muted-foreground">Hace {i + 1} días</p>
                        </div>
                        <div className="text-sm font-medium">{(0.1 * (i + 1)).toFixed(1)} ETH</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedNFT && (
        <Dialog open={isModalOpen} onClose={closeModal}>
          <div className="max-w-2xl">
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedNFT.name || `NFT #${selectedNFT.tokenId}`}</DialogTitle>
                <DialogDescription>
                  <img
                    alt={selectedNFT.name || `NFT #${selectedNFT.tokenId}`}
                    className="w-full h-64 object-cover rounded-lg"
                    src={selectedNFT.image || DEFAULT_IMAGE}
                    style={{
                      objectFit: "cover",
                    }}
                  />
                  <p className="mt-4">{selectedNFT.description || "No hay descripción disponible."}</p>
                  {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold">Atributos</h3>
                      <ul className="mt-2 grid grid-cols-2 gap-2">
                        {selectedNFT.attributes.map((attr, index) => (
                          <li key={index} className="flex justify-between">
                            <span className="font-medium">{attr.trait_type}:</span>
                            <span>{attr.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedNFT.tokenURI && (
                    <div className="mt-4">
                      <h3 className="font-semibold">Token URI</h3>
                      <a
                        href={selectedNFT.tokenURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline mt-2 block break-all"
                      >
                        {selectedNFT.tokenURI}
                      </a>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" onClick={closeModal}>
                  Cerrar
                </Button>
              </div>
            </DialogContent>
          </div>
        </Dialog>
      )}
    </div>
  );
}