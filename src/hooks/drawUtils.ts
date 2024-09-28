/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { State } from '../types/types';

const isValidCoordinate = (x: number, y: number, gridSize: number): boolean => {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
};

export const interpolate = (x0: number, y0: number, x1: number, y1: number): [number, number][] => {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (x !== x1 || y !== y1) {
    points.push([x, y]);
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  points.push([x1, y1]); // Añadir el punto final

  return points;
};

export const draw = (
  x: number,
  y: number,
  color: string | null,
  state: State,
  updatePixel: (x: number, y: number, color: string | null) => void,
  markPixelAsModified: (key: string) => void,
  lastDrawnPixelRef: React.MutableRefObject<string | null>,
  currentStrokeRef: React.MutableRefObject<[string, string][]>
) => {
  const pixelKey = `${x},${y}`;

  if (isValidCoordinate(x, y, state.gridSize) && pixelKey !== lastDrawnPixelRef.current) {
    if (lastDrawnPixelRef.current) {
      const [lastX, lastY] = lastDrawnPixelRef.current.split(',').map(Number);
      const interpolatedPoints = interpolate(lastX, lastY, x, y);

      interpolatedPoints.forEach(([ix, iy]) => {
        const interpolatedKey = `${ix},${iy}`;
        updatePixel(ix, iy, color);
        markPixelAsModified(interpolatedKey);
        currentStrokeRef.current.push([interpolatedKey, color || '']);
      });
    } else {
      updatePixel(x, y, color);
      markPixelAsModified(pixelKey);
      currentStrokeRef.current.push([pixelKey, color || '']);
    }

    lastDrawnPixelRef.current = pixelKey;
  }
};