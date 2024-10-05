import { NextApiRequest, NextApiResponse } from 'next';
import { createPublicClient, http, createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import { Address } from 'viem';

const MARKETPLACE_ADDRESS = '0x960f887ddf97d872878e6fa7c25d7a059f8fb6d7' as Address;

// Definimos el ABI mínimo necesario para la función approve
const APPROVE_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

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

    // Nota: En un entorno de servidor, no tenemos acceso a window.ethereum
    // Esta parte debería manejarse en el frontend
    const walletClient = createWalletClient({
      chain: base,
      transport: http()
    });

    // Simulamos la aprobación (esto debería hacerse en el frontend)
    const approveData = await publicClient.simulateContract({
      address: nftAddress as Address,
      abi: APPROVE_ABI,
      functionName: 'approve',
      args: [MARKETPLACE_ADDRESS, BigInt(tokenId)],
      account: userAddress as Address,
    });

    console.log('Aprobación simulada:', approveData);

    // Simulamos la creación del item en el marketplace
    const listData = await publicClient.simulateContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'createMarketItem',
      args: [nftAddress as Address, BigInt(tokenId), BigInt(price)],
      account: userAddress as Address,
    });

    console.log('Listado simulado:', listData);

    // En un entorno real, aquí se ejecutarían las transacciones
    // y se esperaría por los recibos

    return res.status(200).json({ 
      success: true, 
      message: 'Simulación de listado completada con éxito'
    });
  } catch (error) {
    console.error('Error al simular el listado del NFT:', error);
    return res.status(500).json({ error: 'Error al simular el listado del NFT' });
  }
}