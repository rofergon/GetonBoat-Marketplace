import { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy, Network, OwnedNft, AcquiredAt } from 'alchemy-sdk';
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

const DEFAULT_IMAGE = '/path/to/default-nft-image.jpg';

const dbClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Función para manejar diferentes tipos de acquiredAt
function getAcquiredAtTime(acquiredAt: AcquiredAt | undefined): number {
  if (!acquiredAt) return 0;
  if (typeof acquiredAt === 'string') return new Date(acquiredAt).getTime();
  if (acquiredAt instanceof Date) return acquiredAt.getTime();
  return 0;
}

async function updateNFTsInDatabase(userAddress: string, nfts: OwnedNft[]) {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  for (const nft of nfts) {
    const { tokenId, contract, name, image, description, tokenUri, raw } = nft;
    const attributes = JSON.stringify(raw?.metadata?.attributes || []);
    const acquiredAt = getAcquiredAtTime(nft.acquiredAt);

    try {
      await dbClient.execute({
        sql: `
          INSERT INTO NFTs (
            owner_address, token_id, contract_address, name, image, description,
            token_uri, attributes, acquired_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(owner_address, token_id, contract_address)
          DO UPDATE SET
            name = ?, image = ?, description = ?, token_uri = ?,
            attributes = ?, acquired_at = ?, updated_at = ?
        `,
        args: [
          userAddress, tokenId, contract.address, name || `NFT #${tokenId}`,
          image?.thumbnailUrl || DEFAULT_IMAGE, description || '',
          tokenUri || '', attributes, acquiredAt, currentTimestamp,
          name || `NFT #${tokenId}`, image?.thumbnailUrl || DEFAULT_IMAGE,
          description || '', tokenUri || '', attributes, acquiredAt, currentTimestamp
        ]
      });
      console.log(`NFT ${tokenId} actualizado en la base de datos.`);
    } catch (error) {
      console.error(`Error al actualizar NFT ${tokenId} en la base de datos:`, error);
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userAddress } = req.query;

  if (!userAddress || typeof userAddress !== 'string') {
    return res.status(400).json({ error: 'Dirección de cartera no proporcionada o inválida' });
  }

  const cacheKey = `nfts_${userAddress}`;
  const cachedData = cache.get(cacheKey);

  try {
    let responseData;

    if (cachedData) {
      responseData = cachedData;
    } else {
      const nftsResponse = await alchemy.nft.getNftsForOwner(userAddress);

      // Ordenar los NFTs por fecha de adquisición (si está disponible) o por tokenId
      const sortedNfts = nftsResponse.ownedNfts.sort((a, b) => {
        const dateA = getAcquiredAtTime(a.acquiredAt);
        const dateB = getAcquiredAtTime(b.acquiredAt);
        return dateB - dateA; // Orden descendente
      });

      // Tomar los últimos 10 NFTs
      const latestNfts = sortedNfts.slice(0, 10);

      // Actualizar la base de datos con los NFTs obtenidos
      await updateNFTsInDatabase(userAddress, latestNfts);

      responseData = {
        address: userAddress,
        nfts: latestNfts.map((nft: OwnedNft) => ({
          id: nft.tokenId,
          name: nft.name || `NFT #${nft.tokenId}`,
          tokenId: nft.tokenId,
          image: nft.image?.thumbnailUrl || DEFAULT_IMAGE,
          description: nft.description,
          tokenURI: nft.tokenUri,
          attributes: nft.raw?.metadata?.attributes,
          acquiredAt: getAcquiredAtTime(nft.acquiredAt).toString(),
        })),
        totalCount: nftsResponse.totalCount,
      };

      // Guardar en el caché
      cache.set(cacheKey, responseData);
    }

    // Devolver la respuesta
    if (responseData.nfts.length === 0) {
      res.status(404).json({ message: 'No se encontraron NFTs coleccionados' });
    } else {
      res.status(200).json(responseData);
    }
  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: (error as Error).message });
  } finally {
    await dbClient.close();
  }
}