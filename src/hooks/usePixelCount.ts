import { useState, useEffect } from 'react';
import { State, Layer, Frame } from '../types/types';

export const usePixelCountAndDroplets = (state: State, initialDroplets: number) => {
  const [pixelCount, setPixelCount] = useState(0);
  const [droplets, setDroplets] = useState(initialDroplets);

  useEffect(() => {
    console.log('usePixelCountAndDroplets - Efecto iniciado');
    console.log('Estado inicial:', { state, initialDroplets });
    
    let totalPixelCount = 0;
    
    state.frames.forEach((frame: Frame, frameIndex: number) => {
      frame.layers.forEach((layer: Layer, layerIndex: number) => {
        if (layer.visible) {
          const layerPixelCount = layer.pixels.size;
          totalPixelCount += layerPixelCount;
          console.log(`Frame ${frameIndex}, Capa ${layerIndex}: ${layerPixelCount} píxeles`);
        }
      });
    });

    console.log('Recuento total de píxeles:', totalPixelCount);
    setPixelCount(totalPixelCount);
    
    const newDroplets = Math.max(0, initialDroplets - totalPixelCount);
    console.log('Nuevas gotas calculadas:', newDroplets);
    setDroplets(newDroplets);
    
    console.log('usePixelCountAndDroplets - Efecto completado');
  }, [state.frames, initialDroplets]);

  return { pixelCount, droplets };
};
