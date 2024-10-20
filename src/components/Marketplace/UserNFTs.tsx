import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import CustomImage from '../ui/CustomImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useCreateMarketSale } from '../../hooks/Marketplace/useCreateMarketSale';
import { toast } from 'react-hot-toast';
import { formatEther } from 'viem';
import { Loader2 } from "lucide-react";
import { NFT } from '../../types/types';

interface UserNFTsProps {
  userAddress: string;
}

const UserNFTs: React.FC<UserNFTsProps> = ({ userAddress }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { handleCreateMarketSale, isBuying, isSuccess } = useCreateMarketSale();

  const fetchUserNFTs = useCallback(async () => {
    if (!userAddress) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/collected-nfts?userAddress=${userAddress}`);
      const data = await response.json();
      setNfts(data.nfts.map((nft: NFT) => ({
        ...nft,
        isListed: nft.marketItemId !== null && nft.marketItemId !== undefined
      })));
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
        fetchUserNFTs(); // Actualizar la lista de NFTs
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6">NFTs de {userAddress}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <Card key={nft.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div
                className="aspect-square relative cursor-pointer"
                onClick={() => handleOpenDialog(nft)}
              >
                <CustomImage
                  alt={`NFT ${nft.name || nft.tokenId}`}
                  src={nft.image || "/placeholder.svg"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg">{nft.name || `NFT #${nft.tokenId}`}</CardTitle>
              {nft.isListed && (
                <p className="text-sm text-muted-foreground mt-2">
                  Precio: {formatEther(BigInt(nft.listedPrice || '0'))} ETH
                </p>
              )}
            </CardContent>
            <CardFooter>
              {nft.isListed && (
                <Button
                  className="w-full"
                  onClick={() => handleBuy(nft)}
                  disabled={isBuying}
                >
                  {isBuying ? 'Comprando...' : 'Comprar'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNFT?.name || `NFT #${selectedNFT?.tokenId}`}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="w-full h-auto aspect-square relative">
              <CustomImage
                alt={`NFT ${selectedNFT?.name || selectedNFT?.tokenId}`}
                src={selectedNFT?.image || "/placeholder.svg"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <p className="mt-2">{selectedNFT?.description}</p>
            <p className="mt-2">ID del Token: {selectedNFT?.tokenId}</p>
            <p>Dirección del Contrato: {selectedNFT?.contractAddress}</p>
            {selectedNFT?.isListed && (
              <p className="mt-2">Precio listado: {formatEther(BigInt(selectedNFT.listedPrice || '0'))} ETH</p>
            )}
            {selectedNFT?.attributes && selectedNFT.attributes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold">Atributos:</h4>
                <ul className="list-disc list-inside">
                  {selectedNFT.attributes.map((attr, index) => (
                    <li key={index}>{attr.trait_type}: {attr.value}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserNFTs;