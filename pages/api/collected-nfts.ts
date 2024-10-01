import { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy, Network, OwnedNft } from 'alchemy-sdk';
import NodeCache from 'node-cache';

// Definir el tipo AcquiredAt si no está disponible en alchemy-sdk
type AcquiredAt = string | Date | null;

// Configuración de Alchemy
const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

// Inicializa el caché con un tiempo de vida de 1 hora (3600 segundos)
const cache = new NodeCache({ stdTTL: 10000 });

// Definir DEFAULT_IMAGE
const DEFAULT_IMAGE = '/path/to/default-nft-image.jpg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userAddress } = req.query;
    
    console.log('Solicitud recibida:', { userAddress });

    if (!userAddress || typeof userAddress !== 'string' || !userAddress.startsWith('0x')) {
      console.log('Dirección de cartera inválida:', userAddress);
      return res.status(400).json({ error: 'Dirección de cartera no proporcionada o inválida' });
    }

    console.log('Procesando solicitud para la dirección:', userAddress);

    const cacheKey = `nfts_${userAddress}`;
    const cachedData = cache.get(cacheKey);

    let responseData;

    if (cachedData) {
      console.log('Usando datos en caché para la clave:', cacheKey);
      responseData = cachedData;
    } else {
      console.log('Caché no encontrado o expirado para la clave:', cacheKey);
      console.log('Realizando solicitud a Alchemy para la dirección:', userAddress);

      // Obtener los NFTs utilizando Alchemy (sin límite inicial)
      const nftsResponse = await alchemy.nft.getNftsForOwner(userAddress as string);

      console.log('Respuesta de Alchemy:', JSON.stringify(nftsResponse, null, 2));

      // Función auxiliar para convertir AcquiredAt a número
      const getAcquiredAtTime = (acquiredAt: AcquiredAt): number => {
        if (!acquiredAt) return 0;
        if (typeof acquiredAt === 'string') return new Date(acquiredAt).getTime();
        if (acquiredAt instanceof Date) return acquiredAt.getTime();
        return 0;
      };

      // Ordenar los NFTs por fecha de adquisición (si está disponible) o por tokenId
      const sortedNfts = nftsResponse.ownedNfts.sort((a, b) => {
        const dateA = getAcquiredAtTime(a.acquiredAt as AcquiredAt) || parseInt(a.tokenId);
        const dateB = getAcquiredAtTime(b.acquiredAt as AcquiredAt) || parseInt(b.tokenId);
        return dateB - dateA; // Orden descendente
      });

      // Tomar los últimos 10 NFTs
      const latestNfts = sortedNfts.slice(0, 10);

      responseData = {
        address: userAddress,
        nfts: latestNfts.map((nft: OwnedNft) => ({
          id: nft.tokenId,
          name: nft.contract?.name || `NFT #${nft.tokenId}`,
          tokenId: nft.tokenId,
          image: nft.image?.thumbnailUrl || DEFAULT_IMAGE,
          description: nft.description,
          tokenURI: nft.tokenUri,
          attributes: nft.raw?.metadata?.attributes,
          acquiredAt: nft.acquiredAt ? getAcquiredAtTime(nft.acquiredAt as AcquiredAt).toString() : null,
        })),
        totalCount: nftsResponse.totalCount,
      };

      console.log('Últimos 10 NFTs obtenidos de Alchemy:', responseData.nfts.length);

      // Guardar en el caché
      cache.set(cacheKey, responseData);
      console.log('Datos guardados en caché con la clave:', cacheKey);
    }

    // Devolver la respuesta
    if (responseData.nfts.length === 0) {
      console.log('No se encontraron NFTs para la dirección:', userAddress);
      res.status(404).json({ message: 'No se encontraron NFTs coleccionados' });
    } else {
      console.log('Enviando respuesta con', responseData.nfts.length, 'NFTs');
      res.status(200).json(responseData);
    }
  } catch (error) {
    console.error('Error detallado:', error);
    console.error('Stack trace:', (error as Error).stack);
    res.status(500).json({ error: 'Error interno del servidor', details: (error as Error).message });
  }
}