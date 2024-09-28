import { useState } from 'react';
import GIF from 'gif.js';
import { State, Layer } from '../types/types';

export function useExportGif(state: State, fps: number) {
  const [isExporting, setIsExporting] = useState(false);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error('Error loading image:', e);
        reject(new Error(`Failed to load image from ${proxyUrl}`));
      };
      img.src = proxyUrl;
    });
  };

  const calculatePaintedArea = (frames: State['frames']): { minX: number, minY: number, maxX: number, maxY: number } => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    frames.forEach(frame => {
      frame.layers.forEach((layer: Layer) => {
        if (layer.visible) {
          layer.pixels.forEach((color: string, key: string) => {
            const [x, y] = key.split(',').map(Number);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          });
        }
      });
    });
    return { minX, minY, maxX, maxY };
  };

  const exportGif = async () => {
    if (state.frames.length === 0) {
      alert("No frames to export. Please add frames first.");
      return;
    }

    setIsExporting(true);
    try {
      console.log('Starting GIF export');

      const { minX, minY, maxX, maxY } = calculatePaintedArea(state.frames);
      const paintedWidth = maxX - minX + 1;
      const paintedHeight = maxY - minY + 1;
      const margin = 300; 

      const zoomFactor = Math.min(
        (state.canvasSize - 2 * margin) / paintedWidth,
        (state.canvasSize - 2 * margin) / paintedHeight
      );

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: state.canvasSize,
        height: state.canvasSize,
        workerScript: '/gif.worker.js'
      });

      let backgroundImage: HTMLImageElement | null = null;
      if (state.showBackgroundImage && state.dailyImageUrl) {
        try {
          backgroundImage = await loadImage(state.dailyImageUrl);
        } catch (error) {
          console.error('Failed to load background image:', error);
        }
      }

      for (const frame of state.frames) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = state.canvasSize;
        tempCanvas.height = state.canvasSize;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (tempCtx) {
          tempCtx.save();
          tempCtx.translate(margin, margin);
          tempCtx.scale(zoomFactor, zoomFactor);
          tempCtx.translate(-minX, -minY);

          if (backgroundImage) {
            tempCtx.drawImage(backgroundImage, 0, 0, state.gridSize, state.gridSize);
          }

          frame.layers.forEach((layer: Layer) => {
            if (layer.visible) {
              tempCtx.globalAlpha = layer.opacity;
              layer.pixels.forEach((color, key) => {
                const [x, y] = key.split(',').map(Number);
                tempCtx.fillStyle = color;
                tempCtx.fillRect(x, y, 1, 1);
              });
            }
          });

          tempCtx.restore();
          gif.addFrame(tempCanvas, { delay: 1000 / fps });
        }
      }

      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pixel-art-animation.gif';
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        console.log('GIF export completed successfully');
      });

      gif.render();
    } catch (error) {
      console.error("Error creating GIF:", error);
      alert("There was an error creating the GIF. Please check the console for more details.");
      setIsExporting(false);
    }
  };

  return { exportGif, isExporting };
}