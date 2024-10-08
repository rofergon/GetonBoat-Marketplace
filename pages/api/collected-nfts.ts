import { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';
import NodeCache from 'node-cache';
import { NFTDatabaseManager } from './nftDatabaseManager';

// Configuración de Alchemy
const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

// Inicializa el caché con un tiempo de vida de 1 hora (3600 segundos)
const cache = new NodeCache({ stdTTL: 100 });

const DEFAULT_IMAGE = '/placeholder.png';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userAddress } = req.query;
  
  console.log('Query params:', req.query);
  
  if (!userAddress || typeof userAddress !== 'string') {
    console.log('Dirección de usuario inválida:', userAddress);
    return res.status(400).json({ error: 'Dirección de usuario inválida' });
  }

  const address = userAddress.toLowerCase();
  console.log('Dirección de usuario procesada:', address);

  const cacheKey = `nfts_${address}`;
  let responseData = cache.get(cacheKey) as any;
  console.log('Datos en caché:', responseData ? 'Encontrados' : 'No encontrados');

  const dbManager = new NFTDatabaseManager();

  try {
    const { lastUpdateBlock, lastUpdateTime } = await dbManager.getLastUpdate(address);
    
    console.log('Última actualización en BD - Bloque:', lastUpdateBlock, 'Tiempo:', new Date(lastUpdateTime).toISOString());

    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastUpdateTime;

    const currentBlock = await alchemy.core.getBlockNumber();
    console.log('Bloque actual:', currentBlock);

    const fromBlockHex = `0x${lastUpdateBlock.toString(16)}`;

    const transfers = await alchemy.core.getAssetTransfers({
      fromBlock: fromBlockHex,
      toBlock: "latest",
      toAddress: address,
      category: [AssetTransfersCategory.ERC721, AssetTransfersCategory.ERC1155],
    });

    const hasNewTransfers = transfers.transfers.length > 0;
    console.log('Nuevas transferencias:', hasNewTransfers ? 'Sí' : 'No');

    const CACHE_TTL = 3600 * 1000; // 1 hora en milisegundos

    console.log('Tiempo desde la última actualización:', timeSinceLastUpdate / 1000, 'segundos');

    const shouldUpdate = timeSinceLastUpdate > CACHE_TTL || hasNewTransfers;

    if (responseData) {
      console.log('Using data from cache');
    } else if (!shouldUpdate) {
      console.log('Fetching data from database...');
      const nfts = await dbManager.getNFTsFromDatabase(address);

      responseData = {
        nfts,
        totalCount: nfts.length,
      };

      cache.set(cacheKey, responseData);
      console.log('Data loaded from database and cached');
    } else {
      console.log('Fetching data from Alchemy...');
      const nftsResponse = await alchemy.nft.getNftsForOwner(address);
      console.log('NFTs obtenidos de Alchemy:', nftsResponse.ownedNfts.length);

      console.log('Actualizando base de datos...');
      await dbManager.updateNFTsInDatabase(address, nftsResponse.ownedNfts, currentBlock);
      console.log('Base de datos actualizada');

      await dbManager.updateLastUpdate(address, currentBlock);
      console.log('Last update saved in DB');

      responseData = {
        nfts: nftsResponse.ownedNfts.map((nft) => ({
          contractAddress: nft.contract.address,
          name: nft.name || `NFT #${nft.tokenId}`,
          tokenId: nft.tokenId,
          image: nft.image?.cachedUrl || nft.image?.originalUrl || DEFAULT_IMAGE,
          description: nft.description || '',
          tokenURI: nft.tokenUri,
          attributes: nft.raw?.metadata?.attributes || [],
          acquiredAt: nft.acquiredAt?.toString(),
        })),
        totalCount: nftsResponse.totalCount,
      };

      cache.set(cacheKey, responseData);
      console.log('Data saved in cache');
    }

    console.log('Sending response...');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: (error as Error).message });
  } finally {
    await dbManager.close();
    console.log('Conexión a la base de datos cerrada');
  }
}