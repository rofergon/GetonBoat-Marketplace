import { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy, Network, AssetTransfersCategory, Nft } from 'alchemy-sdk';
import { NFTDatabaseManager } from './nftDatabaseManager';

// Configuración de Alchemy
const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userAddress } = req.query;
  
  if (!userAddress || typeof userAddress !== 'string') {
    return res.status(400).json({ error: 'Dirección de usuario inválida' });
  }

  const address = userAddress.toLowerCase();
  const dbManager = new NFTDatabaseManager();

  try {
    const { lastUpdateBlock } = await dbManager.getLastUpdate(address);
    
    const currentBlock = await alchemy.core.getBlockNumber();
    console.log('Bloque actual:', currentBlock);

    const fromBlockHex = `0x${lastUpdateBlock.toString(16)}`;

    // Obtener transferencias desde el último bloque actualizado
    const transfers = await alchemy.core.getAssetTransfers({
      fromBlock: fromBlockHex,
      toBlock: "latest",
      toAddress: address,
      category: [AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
    });

    // Obtener transferencias salientes
    const outgoingTransfers = await alchemy.core.getAssetTransfers({
      fromBlock: fromBlockHex,
      toBlock: "latest",
      fromAddress: address,
      category: [AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
    });

    // Procesar nuevos NFTs
    for (const transfer of transfers.transfers) {
      if (transfer.tokenId && transfer.rawContract.address) {
        try {
          const nft: Nft = await alchemy.nft.getNftMetadata(
            transfer.rawContract.address,
            transfer.tokenId
          );
          await dbManager.updateNFTInDatabase(nft);
        } catch (error) {
          console.error(`Error al obtener metadatos para NFT: ${transfer.rawContract.address} - ${transfer.tokenId}`, error);
        }
      }
    }

    // Eliminar NFTs transferidos
    for (const transfer of outgoingTransfers.transfers) {
      if (transfer.tokenId && transfer.rawContract.address) {
        await dbManager.removeNFTFromDatabase(address, transfer.rawContract.address, transfer.tokenId);
      }
    }

    // Actualizar el último bloque procesado
    await dbManager.updateLastUpdate(address, currentBlock);

    // Obtener NFTs actualizados de la base de datos
    const updatedNFTs = await dbManager.getNFTsFromDatabase(address);

    res.status(200).json({ nfts: updatedNFTs, totalCount: updatedNFTs.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    await dbManager.close();
  }
}
