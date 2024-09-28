/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useCallback, useRef, MutableRefObject, useEffect } from 'react';
import { State, Layer } from '../types/types';

interface CanvasRefs {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stateRef: MutableRefObject<State>;
}

interface CanvasDisplayFunctions {
  updateCanvasDisplay: () => void;
  markPixelAsModified: (layerId: string, key: string) => void;
}

const useCanvasDisplay = ({ canvasRef, stateRef }: CanvasRefs): CanvasDisplayFunctions => {
  const modifiedPixelsRef = useRef<Map<string, Set<string>>>(new Map());
  const requestIdRef = useRef<number | null>(null);

  const updateCanvasDisplay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { frames, currentFrameIndex, canvasSize, gridSize } = stateRef.current;
    const currentFrame = frames[currentFrameIndex];
    if (!currentFrame) return;

    const cellSize = canvasSize / gridSize;

    // Create an off-screen canvas for drawing
    const offScreenCanvas = document.createElement('canvas');
    offScreenCanvas.width = canvasSize;
    offScreenCanvas.height = canvasSize;
    const offCtx = offScreenCanvas.getContext('2d');
    if (!offCtx) return;

    // Copy the existing canvas content to the off-screen canvas
    offCtx.drawImage(canvas, 0, 0);

    currentFrame.layers.forEach((layer: Layer) => {
      if (layer.visible) {
        const modifiedPixels = modifiedPixelsRef.current.get(layer.id) || new Set();
        modifiedPixels.forEach((key) => {
          const [pixelX, pixelY] = key.split(',').map(Number);
          const color = layer.pixels.get(key);

          offCtx.globalAlpha = layer.opacity;
          if (color) {
            offCtx.fillStyle = color;
            offCtx.fillRect(pixelX * cellSize, pixelY * cellSize, cellSize, cellSize);
          } else {
            offCtx.clearRect(pixelX * cellSize, pixelY * cellSize, cellSize, cellSize);
          }
        });
      }
    });

    // Reset global alpha
    offCtx.globalAlpha = 1;

    // Draw the off-screen canvas onto the main canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.drawImage(offScreenCanvas, 0, 0);

    // Force a repaint on iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      canvas.style.display = 'none';
      canvas.offsetHeight; // Trigger reflow
      canvas.style.display = 'block';
    }

    modifiedPixelsRef.current.clear();
  }, [canvasRef, stateRef]);

  const markPixelAsModified = useCallback((layerId: string, key: string) => {
    if (!modifiedPixelsRef.current.has(layerId)) {
      modifiedPixelsRef.current.set(layerId, new Set());
    }
    modifiedPixelsRef.current.get(layerId)!.add(key);
    
    if (requestIdRef.current === null) {
      requestIdRef.current = requestAnimationFrame(() => {
        updateCanvasDisplay();
        requestIdRef.current = null;
      });
    }
  }, [updateCanvasDisplay]);

  useEffect(() => {
    return () => {
      if (requestIdRef.current !== null) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return { updateCanvasDisplay, markPixelAsModified };
};

export default useCanvasDisplay;