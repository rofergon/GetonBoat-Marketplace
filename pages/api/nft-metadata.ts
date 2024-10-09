import { NextApiRequest, NextApiResponse } from 'next';
import { NFTDatabaseManager } from './nftDatabaseManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { tokenId, contractAddress } = req.query;

  if (!tokenId || !contractAddress) {
    return res.status(400).json({ message: 'Se requieren tokenId y contractAddress' });
  }

  const dbManager = new NFTDatabaseManager();

  try {
    const nftData = await dbManager.getNFTMetadata(contractAddress as string, tokenId as string);

    if (nftData) {
      res.status(200).json({
        name: nftData.name,
        imageurl: nftData.imageurl,
        description: nftData.description,
        attributes: nftData.attributes
      });
    } else {
      res.status(404).json({ message: 'NFT no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener metadatos del NFT:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    await dbManager.close();
  }
}