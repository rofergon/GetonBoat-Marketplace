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
    // Comprobar si hay datos de la wallet en la base de datos
    const existingData = await dbManager.getWalletData(address);

    if (!existingData) {
      console.log('No hay datos existentes para esta wallet. Obteniendo datos de Alchemy...');
      // Si no hay datos, obtener NFTs de Alchemy
      const nfts = await alchemy.nft.getNftsForOwner(address);
      
      // Procesar y guardar los NFTs en la base de datos
      for (const nft of nfts.ownedNfts) {
        await dbManager.updateNFTInDatabase(nft, address);
      }

      // Actualizar el último bloque procesado
      const currentBlock = await alchemy.core.getBlockNumber();
      await dbManager.updateLastUpdate(address, currentBlock);

      console.log('Datos de Alchemy guardados en la base de datos');
    } else {
      console.log('Datos existentes encontrados para esta wallet');
      // Si hay datos, actualizar desde el último bloque procesado
      const lastUpdateData = await dbManager.getLastUpdate(address);
      const currentBlock = await alchemy.core.getBlockNumber();
      console.log('Bloque actual:', currentBlock);

      if (lastUpdateData !== null && currentBlock > lastUpdateData.lastUpdateBlock) {
        const fromBlockHex = `0x${lastUpdateData.lastUpdateBlock.toString(16)}`;
        const transfers = await alchemy.core.getAssetTransfers({
          fromBlock: fromBlockHex,
          toBlock: "latest",
          toAddress: address,
          category: [AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
        });

        for (const transfer of transfers.transfers) {
          if (transfer.tokenId && transfer.rawContract.address) {
            const nft = await alchemy.nft.getNftMetadata(
              transfer.rawContract.address,
              transfer.tokenId
            );
            await dbManager.updateNFTInDatabase(nft, address);
          }
        }

        await dbManager.updateLastUpdate(address, currentBlock);
      }
    }

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
