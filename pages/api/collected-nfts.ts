import { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy, Network, AssetTransfersCategory, OwnedNft } from 'alchemy-sdk';
import NodeCache from 'node-cache';
import { createClient } from '@libsql/client';

// Configuración de Alchemy
const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

// Inicializa el caché con un tiempo de vida de 1 hora (3600 segundos)
const cache = new NodeCache({ stdTTL: 3600 });

const DEFAULT_IMAGE = '/placeholder.svg';

// Definir el tipo AcquiredAt
type AcquiredAt = string | Date | undefined;

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

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    const lastUpdateResult = await client.execute({
      sql: 'SELECT last_update_block, last_update_time FROM LastUpdate WHERE owner_address = ?',
      args: [address]
    });
    
    const lastUpdateBlock = lastUpdateResult.rows[0]?.last_update_block as number || 0;
    const lastUpdateTime = lastUpdateResult.rows[0]?.last_update_time as number || 0;
    
    console.log('Última actualización en BD - Bloque:', lastUpdateBlock, 'Tiempo:', new Date(lastUpdateTime).toISOString());

    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastUpdateTime;

    const currentBlock = await alchemy.core.getBlockNumber();
    console.log('Bloque actual:', currentBlock);

    // Convertir el número de bloque a una cadena hexadecimal
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
      // Fetch data from the database
      const nftsResult = await client.execute({
        sql: 'SELECT * FROM NFTs WHERE owner_address = ?',
        args: [address]
      });

      const nfts = nftsResult.rows.map((row: any) => ({
        contractAddress: row.contract_address,
        name: row.name,
        tokenId: row.token_id,
        image: row.image || DEFAULT_IMAGE,
        description: row.description || '',
        tokenURI: row.token_uri || '',
        attributes: JSON.parse(row.attributes || '[]'),
        acquiredAt: new Date(row.acquired_at).toString(),
      }));

      responseData = {
        nfts,
        totalCount: nfts.length,
      };

      // Cache the data
      cache.set(cacheKey, responseData);
      console.log('Data loaded from database and cached');
    } else {
      console.log('Fetching data from Alchemy...');
      const nftsResponse = await alchemy.nft.getNftsForOwner(address);
      console.log('NFTs obtenidos de Alchemy:', nftsResponse.ownedNfts.length);

      console.log('Actualizando base de datos...');
      for (const nft of nftsResponse.ownedNfts) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO NFTs (
            owner_address, token_id, contract_address, name, image, description, 
            token_uri, attributes, acquired_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            address,
            nft.tokenId,
            nft.contract.address,
            nft.name || `NFT #${nft.tokenId}`,
            nft.image?.cachedUrl || nft.image?.originalUrl || DEFAULT_IMAGE,
            nft.description || '',
            getTokenUri(nft.tokenUri),
            JSON.stringify(nft.raw?.metadata?.attributes || []),
            getAcquiredAtTime(nft.acquiredAt as AcquiredAt),
            currentBlock
          ]
        });
      }
      console.log('Base de datos actualizada');

      // Update the block number instead of the timestamp
      await client.execute({
        sql: 'INSERT OR REPLACE INTO LastUpdate (owner_address, last_update_block, last_update_time) VALUES (?, ?, ?)',
        args: [address, currentBlock, Date.now()]
      });
      console.log('Last update saved in DB');

      responseData = {
        nfts: nftsResponse.ownedNfts.map((nft) => ({
          contractAddress: nft.contract.address,
          name: nft.name || `NFT #${nft.tokenId}`,
          tokenId: nft.tokenId,
          image: nft.image?.cachedUrl || nft.image?.originalUrl || DEFAULT_IMAGE,
          description: nft.description || '',
          tokenURI: getTokenUri(nft.tokenUri),
          attributes: nft.raw?.metadata?.attributes || [],
          acquiredAt: getAcquiredAtTime(nft.acquiredAt as AcquiredAt).toString(),
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
    await client.close();
    console.log('Conexión a la base de datos cerrada');
  }
}

function getAcquiredAtTime(acquiredAt: AcquiredAt): number {
  if (!acquiredAt) return 0;
  if (typeof acquiredAt === 'string') return new Date(acquiredAt).getTime();
  if (acquiredAt instanceof Date) return acquiredAt.getTime();
  return 0;
}

function getTokenUri(tokenUri: string | { raw: string } | null | undefined): string {
  if (typeof tokenUri === 'string') {
    return tokenUri;
  } else if (tokenUri && typeof tokenUri === 'object' && 'raw' in tokenUri) {
    return tokenUri.raw;
  }
  return '';
}