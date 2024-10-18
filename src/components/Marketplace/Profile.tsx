/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAccount } from 'wagmi';
import { Address, Avatar, Name, Identity, Badge } from '@coinbase/onchainkit/identity';
import CustomImage from '../ui/CustomImage';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Transaction, TransactionButton, TransactionStatus, TransactionStatusLabel, TransactionStatusAction, LifeCycleStatus } from '@coinbase/onchainkit/transaction';

import { useNFTListing } from '../../hooks/useNFTListing';
import { useFetchMarketItems } from '../../hooks/useFetchMarketItems';
import { useNFTs } from '../../hooks/useNFTs'; // Asumiendo que tienes un hook para obtener los NFTs del usuario
import { ethers } from 'ethers';
import { useCancelNFTListing } from '../../hooks/useCancelNFTListing';
import { parseEther } from 'ethers/lib/utils';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useUserCollections } from '../../hooks/useUserCollections';
import { Loader2 } from "lucide-react"; // Importa el ícono de carga

interface NFT {
  id?: string;
  name?: string;
  tokenId?: string;
  image?: string;
  description?: string;
  tokenURI?: string;
  attributes?: { trait_type: string; value: string }[];
  contractAddress?: string;
  isListed?: boolean;
  listedPrice?: string | null;
  marketItemId?: bigint;
}




const Profile: React.FC = () => {
  const [collectedNFTs, setCollectedNFTs] = useState<NFT[]>([]);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [listingNFT, setListingNFT] = useState<NFT | null>(null);
  const [listingPrice, setListingPrice] = useState<string>('');
  const [listingPriceWei, setListingPriceWei] = useState<string>('');
  const [listingDuration] = useState<number>(7);

  const {
    isApproved,
    isListed,
    approvalTxHash,
    listingTxHash,
    error,
    getApprovalContract,
    getListingContract,
    getCancelListingContract,
  } = useNFTListing(listingNFT?.contractAddress as `0x${string}`, listingNFT?.tokenId || '');

  const [currentPage] = useState(0);
  const { marketItems, totalItems: _totalItems } = useFetchMarketItems(currentPage);
  const { nfts: _nfts } = useNFTs(address);

  const [, setListedNFTs] = useState<Set<string>>(new Set());

  const {
    handleCancelListing: handleCancelListingHook,
    isCancelling,
    isSuccess: isCancelSuccess,
    error: cancelError
  } = useCancelNFTListing();

  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Usar el hook useUserCollections
  const userCollections = useUserCollections(collectedNFTs);

  // Ordenar las colecciones
  const sortedCollections = useMemo(() => {
    return [...userCollections].sort((a, b) => {
      if (a.items === 0 && b.items === 0) return 0;
      if (a.items === 0) return 1;
      if (b.items === 0) return -1;
      return b.items - a.items;
    });
  }, [userCollections]);

  const weiToEth = (weiAmount: string | null): string => {
    if (!weiAmount) return '0';
    return ethers.utils.formatEther(weiAmount);
  };

  const [isLoading, setIsLoading] = useState(true); // Nuevo estado para controlar la carga

  const fetchCollectedNFTs = useCallback(async () => {
    if (!address) return;
    setIsLoading(true); // Inicia la carga
    try {
      const response = await fetch(`/api/collected-nfts?userAddress=${address}`);
      const data = await response.json();

      const nftsWithListingInfo = data.nfts.map((nft: NFT) => {
        const listedItem = marketItems.find(item =>
          item.nftContractAddress.toLowerCase() === (nft.contractAddress?.toLowerCase() ?? '') &&
          item.tokenId.toString() === nft.tokenId
        );

        return {
          ...nft,
          isListed: !!listedItem,
          listedPrice: listedItem ? listedItem.price.toString() : null,
          marketItemId: listedItem ? listedItem.marketItemId : undefined
        };
      });

      setCollectedNFTs(nftsWithListingInfo);

      const listedIds = new Set(nftsWithListingInfo
        .filter((nft: NFT) => nft.isListed)
        .map((nft: NFT) => nft.id?.toString() || '')
      );
      setListedNFTs(listedIds as Set<string>);
    } catch (error) {
      setCollectedNFTs([]);
    } finally {
      setIsLoading(false); // Finaliza la carga
    }
  }, [address, marketItems]);

  useEffect(() => {
    if (address) {
      fetchCollectedNFTs();
    }
  }, [address, fetchCollectedNFTs]);

  const handleApprovalStatus = useCallback(() => {
    // Lógica adicional para manejar el estado de aprobación
  }, []);

  const handleListingStatus = useCallback(() => {
    // Lógica adicional para manejar el estado de listado
  }, []);

  const handleCancelListingStatus = useCallback((status: LifeCycleStatus) => {
    if (status.statusName === 'success') {
      setIsDialogOpen(false);
      fetchCollectedNFTs(); // Actualizar la lista de NFTs después de cancelar
    } else if (status.statusName === 'error') {
      // Manejar el error si es necesario
    }
  }, []);

  const handleCancelListingClick = useCallback((nft: NFT) => {
    if (nft.marketItemId) {
      // Convertimos el marketItemId a un número, eliminando la 'n' al final
      const marketItemIdNumber = Number(nft.marketItemId.toString());
      handleCancelListingHook(BigInt(marketItemIdNumber));
    }
  }, [handleCancelListingHook]);

  useEffect(() => {
    if (isCancelSuccess) {
      fetchCollectedNFTs(); // Actualizar la lista de NFTs después de cancelar
    }
  }, [isCancelSuccess, fetchCollectedNFTs]);

  const handleViewDetails = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsDetailsDialogOpen(true);
  };

  const handleListNFT = (nft: NFT) => {
    setListingNFT(nft);
    setIsDialogOpen(true);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ethValue = e.target.value;
    setListingPrice(ethValue);
    try {
      const weiValue = parseEther(ethValue);
      setListingPriceWei(weiValue.toString());
    } catch (error) {
      console.error('Error al convertir ETH a Wei:', error);
      setListingPriceWei('');
    }
  };

  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Modificar la función para ordenar los NFTs
  const sortedNFTs = useMemo(() => {
    if (!selectedCollection) {
      return collectedNFTs;
    }
    return [...collectedNFTs].sort((a, b) => {
      if (a.contractAddress === selectedCollection && b.contractAddress !== selectedCollection) {
        return -1;
      }
      if (a.contractAddress !== selectedCollection && b.contractAddress === selectedCollection) {
        return 1;
      }
      return 0;
    });
  }, [collectedNFTs, selectedCollection]);

  // Función para manejar el clic en una colección
  const handleCollectionClick = (contractAddress: string) => {
    setSelectedCollection(contractAddress);
  };

  if (!address) {
    return (
      <div className="w-full min-h-screen bg-i flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Conecta tu wallet para ver tu perfil</h2>
          <Button onClick={openConnectModal}>Conectar Wallet</Button>
        </div>
      </div>
    );
  }

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
            address={address || undefined}
            className="w-32 h-32 rounded-full border-4 border-background"
          />
          <div className="mt-4 sm:mt-0 sm:ml-4 mb-2">
            <Identity
              address={address || '0x0'}
              schemaId="0x8d2d6cc5c0f8b3cb29b6e9f5c0c70b39a0c88a7c0e3f5d0d92f1f5e3c64c1a0b"
            >
              <Name className="text-2xl font-bold">
                <Badge />
              </Name>
              <Address
                className="text-sm text-muted-foreground"
              />
            </Identity>
            <div className="mt-1">
              <span className="text-sm">Joined April 2022</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="collected" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="collected">Collected 4.7K</TabsTrigger>
            <TabsTrigger value="created">Created</TabsTrigger>
            <TabsTrigger value="favorited">Favorited 505</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="more">More</TabsTrigger>
          </TabsList>

          <div className="flex flex-col lg:flex-row mt-6">
            <div className="w-full lg:w-56 xl:w-64 mb-6 lg:mb-0 lg:pr-4">
              <h3 className="font-semibold mb-2">Colecciones</h3>
              <div className="space-y-2">
                {sortedCollections.map((collection, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 bg-secondary rounded-xl cursor-pointer ${
                      selectedCollection === collection.contractAddress ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => handleCollectionClick(collection.contractAddress)}
                  >
                    <div>
                      <p className="font-medium">{collection.name}</p>
                      <p className="text-sm text-muted-foreground">{collection.items} items</p>
                    </div>
                    <p className="text-sm">{collection.floorPrice} ETH</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <TabsContent value="collected">
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
                          onClick={() => handleViewDetails(nft)}
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
                            {nft.isListed ? (
                              <Button variant="outline" size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCancelListingClick(nft); }}
                                disabled={isCancelling}
                              >
                                {isCancelling ? 'Cancelando...' : 'Cancelar listado'}
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="card-btn"
                                onClick={(e) => { e.stopPropagation(); handleListNFT(nft); }}
                              >
                                Listar
                              </Button>
                            )}
                          </div>
                          {nft.isListed && (
                            <p className="text-sm mt-1">
                              Precio listado: {weiToEth(nft.listedPrice || null)} ETH
                            </p>
                          )}
                          {cancelError && <p className="text-red-500 text-sm mt-1">{cancelError}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                <Image
                  src={listingNFT.image || "/placeholder.svg"}
                  alt={listingNFT.name || "NFT Image"}
                  width={300}
                  height={300}
                  layout="responsive"
                />
                {!isApproved ? (
                  <Transaction
                    chainId={8453}
                    contracts={getApprovalContract()}
                    onStatus={handleApprovalStatus}
                  >
                    <TransactionButton
                      text="Aprobar NFT"
                      className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    />
                    <TransactionStatus>
                      <TransactionStatusLabel className="text-gray-300" />
                      <TransactionStatusAction className="text-blue-500" />
                    </TransactionStatus>
                  </Transaction>
                ) : !isListed ? (
                  <Transaction
                    chainId={8453}
                    contracts={getListingContract(listingPriceWei, listingDuration)}
                    onStatus={handleListingStatus}
                  >
                    <input
                      type="number"
                      value={listingPrice}
                      onChange={handlePriceChange}
                      placeholder="Ingrese el precio de listado en ETH"
                      className="mt-2 w-full p-2 border rounded"
                    />
                    <TransactionButton
                      text="Listar NFT"
                      className="mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                    />
                    <TransactionStatus>
                      <TransactionStatusLabel className="text-gray-300" />
                      <TransactionStatusAction className="text-blue-500" />
                    </TransactionStatus>
                  </Transaction>
                ) : (
                  <Transaction
                    chainId={8453}
                    contracts={getCancelListingContract()}
                    onStatus={handleCancelListingStatus}
                  >
                    <TransactionButton
                      text="Cancelar Listado"
                      className="mt-2 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
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
                    Transacción de Aprobación: {approvalTxHash}
                  </p>
                )}
                {listingTxHash && (
                  <p className="text-sm text-gray-600 mt-2">
                    Transacción de Listado: {listingTxHash}
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para mostrar detalles del NFT */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
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
                  <p className="mt-2">Precio listado: {weiToEth(selectedNFT.listedPrice || null)} ETH</p>
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
}

export default Profile;
