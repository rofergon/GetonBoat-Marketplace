import { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy, Network, OwnedNft } from 'alchemy-sdk';
import NodeCache from 'node-cache';

// Configuración de Alchemy
const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

// Inicializa el caché con un tiempo de vida de 1 hora (3600 segundos)
const cache = new NodeCache({ stdTTL: 3600 });

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

      // Obtener los NFTs utilizando Alchemy (limitado a 5)
      const nftsResponse = await alchemy.nft.getNftsForOwner(userAddress as string, { pageSize: 10 });

      console.log('Respuesta de Alchemy:', JSON.stringify(nftsResponse, null, 2));

      responseData = {
        address: userAddress,
        nfts: nftsResponse.ownedNfts.slice(0, 10).map((nft: OwnedNft) => ({
          id: nft.tokenId,
          name: nft.contract?.name || `NFT #${nft.tokenId}`,
          tokenId: nft.tokenId,
          image: nft.image?.thumbnailUrl || DEFAULT_IMAGE,
          description: nft.description,
          tokenURI: nft.tokenUri,
          attributes: nft.raw?.metadata?.attributes,
        })),
        totalCount: nftsResponse.totalCount,
        pageKey: nftsResponse.pageKey
      };

      console.log('NFTs obtenidos de Alchemy:', responseData.nfts.length);

      // Agregar logs para los metadatos de los NFTs
      responseData.nfts.forEach((nft, index) => {
        console.log(`Metadatos del NFT ${index + 1}:`);
        console.log('  Título:', nft.name);
        console.log('  Descripción:', nft.description);
        console.log('  ID del token:', nft.tokenId);
        console.log('  Dirección del contrato:', nft.contract?.address || 'No disponible');
        console.log('  Tipo de token:', nft.tokenType);
        console.log('  URL de la imagen:', nft.image || 'No disponible');
        console.log('  Atributos:', JSON.stringify(nft.attributes || [], null, 2));
        console.log('---');
      });

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