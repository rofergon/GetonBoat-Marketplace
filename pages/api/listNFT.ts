import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { Address } from 'viem';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as Address;

// Definimos el ABI mínimo necesario para la función createMarketItem
const MARKETPLACE_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'nftContract', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
    ],
    name: 'createMarketItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nftAddress, tokenId, price, userAddress } = req.body;

  if (!nftAddress || !tokenId || !price || !userAddress) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    });

   
    const listData = await publicClient.simulateContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'createMarketItem',
      args: [nftAddress as Address, BigInt(tokenId), BigInt(price)],
      account: userAddress as Address,
    });

    console.log('Listado simulado:', listData);

    return res.status(200).json({ 
      success: true, 
      message: 'Simulación de listado completada con éxito'
    });
  } catch (error) {
    console.error('Error al simular el listado del NFT:', error);
    return res.status(500).json({ error: 'Error al simular el listado del NFT' });
  }
}