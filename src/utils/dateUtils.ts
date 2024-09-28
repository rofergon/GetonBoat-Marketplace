/* eslint-disable no-unused-vars */
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { BasePaintAbi } from '../abi/BasePaintAbi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const client = createPublicClient({
  chain: base,
  transport: http(),
});

const CONTRACT_ADDRESS = '0xBa5e05cb26b78eDa3A2f8e3b3814726305dcAc83';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Obtiene el día actual consultando el contrato BasePaint.
 * @returns {Promise<number>} - Promesa que resuelve al número de día actual.
 */
export const calculateDay = async (retries = 3, backoff = 1000): Promise<number> => {
  try {
    const today = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: BasePaintAbi,
      functionName: 'today',
    });
    
    return Number(today);
  } catch (error) {
    
    if (retries > 0) {
      await delay(backoff);
      return calculateDay(retries - 1, backoff * 2);
    } else {
      throw error;
    }
  }
};

export function getCurrentDayUTC(): string {
    return dayjs().utc().format('YYYY-MM-DD');
}

/**
 * Obtiene la cantidad total de píxeles pintados para el día actual.
 * @returns {Promise<bigint>} - Promesa que resuelve a la cantidad total de píxeles pintados.
 */
export const getTotalPixelsPaintedToday = async (retries = 3, backoff = 1000): Promise<bigint> => {
  try {
    const today = await calculateDay();
    
    
    const canvas = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: BasePaintAbi,
      functionName: 'canvases',
      args: [BigInt(today)],
    });
    
    
    
    // Verificamos que canvas sea un array y tenga al menos un elemento
    if (Array.isArray(canvas) && canvas.length > 0) {
      const totalContributions = canvas[0];
      
      return totalContributions;
    } else {
      console.error('Formato de respuesta del canvas inesperado:', canvas);
      return BigInt(0);
    }
  } catch (error) {
    console.error('Error al obtener los píxeles pintados:', error);
    if (retries > 0) {
      await delay(backoff);
      return getTotalPixelsPaintedToday(retries - 1, backoff * 2);
    } else {
      console.error('Se agotaron los reintentos para obtener los píxeles pintados');
      return BigInt(0);
    }
  }
};

/**
 * Imprime el número de píxeles pintados cada 30 segundos.
 * @returns {() => void} - Función para detener el intervalo.
 */
export const logPixelsPaintedInterval = (): () => void => {
  const intervalId = setInterval(async () => {
    try {
      const pixelesPintados = await getTotalPixelsPaintedToday();
      
    } catch (error) {
      console.error('Error al obtener los píxeles pintados:', error);
    }
  }, 30000); // 30 segundos

  return () => clearInterval(intervalId);
};

// En algún lugar de tu código de inicialización
const stopLogging = logPixelsPaintedInterval();

// Si en algún momento quieres detener el logging:
// stopLogging();