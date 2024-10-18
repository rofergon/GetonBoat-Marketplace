import { useCallback, useRef, MutableRefObject, useEffect } from 'react';
import { State } from '../../types/types';

function useDrawGrid(gridCanvasRef: MutableRefObject<HTMLCanvasElement | null>,
  stateRef: MutableRefObject<State>) {
  const dprRef = useRef(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      dprRef.current = window.devicePixelRatio || 1;
    }
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { canvasSize, zoom, gridSize } = stateRef.current;
    const scaledSize = canvasSize * zoom;

    // Configura el tamaño del canvas según el DPR (Device Pixel Ratio)
    canvas.width = scaledSize * dprRef.current;
    canvas.height = scaledSize * dprRef.current;
    canvas.style.width = `${scaledSize}px`;
    canvas.style.height = `${scaledSize}px`;

    // Ajusta la escala del contexto para que coincida con el DPR
    ctx.scale(dprRef.current, dprRef.current);

    // Limpia el canvas antes de dibujar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configuración del estilo de la cuadrícula
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
    ctx.lineWidth = 0.5; // Usar un grosor de línea más delgado

    const cellSize = scaledSize / gridSize;

    // Dibujar la cuadrícula
    ctx.beginPath();
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * cellSize + 0.5; // Ajuste para posicionar las líneas correctamente

      // Líneas verticales
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, scaledSize);

      // Líneas horizontales
      ctx.moveTo(0, pos);
      ctx.lineTo(scaledSize, pos);
    }
    ctx.stroke();
  }, [gridCanvasRef, stateRef]);

  return drawGrid;
}

export default useDrawGrid;