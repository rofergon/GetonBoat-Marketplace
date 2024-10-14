/* eslint-disable no-unused-vars */
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { BasePaintAbi } from '../abi/BasePaintAbi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState, useEffect } from 'react';

dayjs.extend(utc);

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org', {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 30000,
  }),
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
export const getTotalPixelsPaintedToday = async (): Promise<bigint> => {
  try {
    const today = await calculateDay();
    const canvas = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: BasePaintAbi,
      functionName: 'canvases',
      args: [BigInt(today)],
    });
    
    return Array.isArray(canvas) && canvas.length > 0 ? canvas[0] : BigInt(0);
  } catch (error) {
    console.error('Error al obtener los píxeles pintados:', error);
    return BigInt(0);
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

// Caché para almacenar los resultados
let cachedDay: number | null = null;
let cachedPixels: bigint | null = null;
let lastUpdateTime = 0;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * Obtiene el día actual del caché o del contrato si es necesario.
 * @returns {Promise<number>} - Promesa que resuelve al número de día actual.
 */
export const getCachedDay = async (): Promise<number> => {
  const now = Date.now();
  if (cachedDay === null || now - lastUpdateTime > CACHE_DURATION) {
    cachedDay = await calculateDay();
    lastUpdateTime = now;
  }
  return cachedDay;
};

/**
 * Obtiene la cantidad total de píxeles pintados del caché o del contrato si es necesario.
 * @returns {Promise<bigint>} - Promesa que resuelve a la cantidad total de píxeles pintados.
 */
export const getCachedTotalPixelsPaintedToday = async (): Promise<bigint> => {
  const now = Date.now();
  if (cachedPixels === null || now - lastUpdateTime > CACHE_DURATION) {
    const today = await getCachedDay();
    const canvas = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: BasePaintAbi,
      functionName: 'canvases',
      args: [BigInt(today)],
    });
    
    cachedPixels = Array.isArray(canvas) && canvas.length > 0 ? canvas[0] : BigInt(0);
    lastUpdateTime = now;
  }
  return cachedPixels;
};

/**
 * Hook personalizado para obtener y actualizar los píxeles pintados.
 * @returns {[bigint, () => void]} - Array con los píxeles pintados y función para forzar actualización.
 */
export const usePixelsPainted = (): [bigint, () => void] => {
  const [pixelsPainted, setPixelsPainted] = useState<bigint>(BigInt(0));

  const updatePixels = async () => {
    const pixels = await getCachedTotalPixelsPaintedToday();
    setPixelsPainted(pixels);
  };

  useEffect(() => {
    updatePixels();
    const interval = setInterval(updatePixels, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  return [pixelsPainted, updatePixels];
};

// Elimina o comenta la función logPixelsPaintedInterval y su uso
// ... resto del código existente ...
