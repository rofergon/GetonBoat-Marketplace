/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useCallback, useRef, MutableRefObject } from 'react';
import { State, Layer } from '../types/types';
import { bucketFill } from '../utils/bucketFill';
import { draw, interpolate } from './drawUtils';

interface UseHandleInteractionProps {
  stateRef: MutableRefObject<State>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  updatePixel: (x: number, y: number, color: string | null) => void;
  updateCanvasDisplay: () => void;
  saveState: (changes: [string, string][]) => void;
  updateState: (newState: Partial<State> | ((prevState: State) => Partial<State>)) => void;
  markPixelAsModified: (layerId: string, key: string) => void;  
}

export const useHandleInteraction = ({
  stateRef,
  canvasRef,
  containerRef,
  updatePixel,
  updateCanvasDisplay,
  saveState,
  updateState,
  markPixelAsModified
}: UseHandleInteractionProps) => {
  const refs = {
    isInteracting: useRef(false),
    isPanning: useRef(false),
    currentStroke: useRef<[string, string][]>([]),
    activeButton: useRef<number | null>(null),
    lastDrawnPixel: useRef<string | null>(null),
    panStart: useRef<{ x: number; y: number } | null>(null),
    isDrawingLine: useRef(false),
    lineStart: useRef<{ clientX: number; clientY: number } | null>(null),
    previewCtx: useRef<CanvasRenderingContext2D | null>(null),
    lastPointerPosition: useRef<{ x: number; y: number } | null>(null), // Nueva referencia
  };

  const getActiveLayer = (state: State): Layer | undefined =>
    state.frames[state.currentFrameIndex]?.layers.find(layer => layer.id === state.activeLayerId);

  const getGridCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { gridX: -1, gridY: -1 };

    const rect = canvas.getBoundingClientRect();
    const { scrollLeft, scrollTop } = container;
    const state = stateRef.current;
    const scale = state.canvasSize / (state.gridSize * state.zoom);
    const x = (clientX - rect.left + scrollLeft) / state.zoom;
    const y = (clientY - rect.top + scrollTop) / state.zoom;

    return {
      gridX: Math.floor(x / (state.canvasSize / state.gridSize)),
      gridY: Math.floor(y / (state.canvasSize / state.gridSize))
    };
  }, [canvasRef, containerRef, stateRef]);

  const handleDraw = useCallback((gridX: number, gridY: number, color: string | null, state: State) => {
    const activeLayer = getActiveLayer(state);
    if (activeLayer) {
      draw(
        gridX,
        gridY,
        color,
        state,
        updatePixel,
        key => markPixelAsModified(activeLayer.id, key),
        refs.lastDrawnPixel,
        refs.currentStroke
      );
    }
  }, [updatePixel, refs.lastDrawnPixel, refs.currentStroke, markPixelAsModified]);

  const handleDrawLine = useCallback((startX: number, startY: number, endX: number, endY: number, color: string | null, state: State) => {
    const activeLayer = getActiveLayer(state);
    if (activeLayer) {
      const points = interpolate(startX, startY, endX, endY);
      points.forEach(([x, y]) => {
        draw(x, y, color, state, updatePixel, key => markPixelAsModified(activeLayer.id, key), refs.lastDrawnPixel, refs.currentStroke);
      });
      updateCanvasDisplay();
      saveState(refs.currentStroke.current);
      refs.currentStroke.current = [];
    }
  }, [getActiveLayer, updatePixel, draw, updateCanvasDisplay, saveState]);

  const initPreviewCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && !refs.previewCtx.current) {
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = canvas.width;
      previewCanvas.height = canvas.height;
      previewCanvas.style.position = 'absolute';
      previewCanvas.style.top = '0';
      previewCanvas.style.left = '0';
      previewCanvas.style.pointerEvents = 'none';
      previewCanvas.style.zIndex = '10';
      canvas.parentNode?.insertBefore(previewCanvas, canvas.nextSibling);
      refs.previewCtx.current = previewCanvas.getContext('2d');
    }
  }, [canvasRef]);

  const drawPreviewLine = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const canvas = canvasRef.current;
    const previewCtx = refs.previewCtx.current;
    if (!canvas || !previewCtx) return;

    const state = stateRef.current;
    const scale = state.zoom;
    const pixelSize = state.canvasSize / state.gridSize;

    previewCtx.clearRect(0, 0, canvas.width, canvas.height);
    previewCtx.save();
    previewCtx.scale(scale, scale);
    
    previewCtx.beginPath();
    previewCtx.moveTo(startX * pixelSize, startY * pixelSize);
    previewCtx.lineTo(endX * pixelSize, endY * pixelSize);
    previewCtx.strokeStyle = state.color || 'black';
    previewCtx.lineWidth = 1 / scale;
    previewCtx.stroke();
    
    previewCtx.restore();
  }, [canvasRef, stateRef]);

  const handleStart = useCallback((e: PointerEvent) => {
    const state = stateRef.current;
    if (state.tool === 'line') {
      initPreviewCanvas();
      refs.isDrawingLine.current = true;
      refs.lineStart.current = { clientX: e.clientX, clientY: e.clientY };
      refs.lastDrawnPixel.current = null;
    } else if (state.tool.startsWith('move')) {
      refs.isPanning.current = true;
      refs.panStart.current = { x: e.clientX, y: e.clientY };
    } else if ([0, 2].includes(e.button)) {
      refs.isInteracting.current = true;
      refs.currentStroke.current = [];
      refs.activeButton.current = e.button;
      refs.lastDrawnPixel.current = null;

      const { gridX, gridY } = getGridCoordinates(e.clientX, e.clientY);
      const activeLayer = getActiveLayer(state);

      if (activeLayer) {
        if (state.tool === 'bucket' && e.button === 0) {
          const newPixels = bucketFill(activeLayer.pixels, gridX, gridY, state.color, state.gridSize);
          updateState(prevState => ({
            frames: prevState.frames.map((frame, index) => 
              index === prevState.currentFrameIndex
                ? {
                    ...frame,
                    layers: frame.layers.map(layer => 
                      layer.id === prevState.activeLayerId
                        ? { ...layer, pixels: new Map(newPixels) }
                        : layer
                    )
                  }
                : frame
            )
          }));
          updateCanvasDisplay();
          saveState(Array.from(newPixels.entries()));
        } else {
          const color = e.button === 0 ? (state.tool === 'eraser' ? null : state.color) : null;
          handleDraw(gridX, gridY, color, state);
          updateCanvasDisplay();
        }
      }
    } else if (e.button === 1) {
      refs.isPanning.current = true;
      refs.panStart.current = { x: e.clientX, y: e.clientY };
    }
  }, [stateRef, refs.isPanning, refs.panStart, refs.isInteracting, refs.currentStroke, refs.activeButton, refs.lastDrawnPixel, getGridCoordinates, updateState, updateCanvasDisplay, saveState, handleDraw, initPreviewCanvas]);

  const handleMove = useCallback((e: PointerEvent) => {
    const state = stateRef.current;
    refs.lastPointerPosition.current = { x: e.clientX, y: e.clientY };

    if (refs.isDrawingLine.current && state.tool === 'line' && refs.lineStart.current) {
      const startPos = getGridCoordinates(refs.lineStart.current.clientX, refs.lineStart.current.clientY);
      const currentPos = getGridCoordinates(e.clientX, e.clientY);
      drawPreviewLine(
        startPos.gridX,
        startPos.gridY,
        currentPos.gridX,
        currentPos.gridY
      );
    } else if (refs.isPanning.current && refs.panStart.current) {
      const container = containerRef.current;
      if (container) {
        container.scrollLeft += refs.panStart.current.x - e.clientX;
        container.scrollTop += refs.panStart.current.y - e.clientY;
        refs.panStart.current = { x: e.clientX, y: e.clientY };
      }
    } else if (refs.isInteracting.current && state.tool !== 'move') {
      const { gridX, gridY } = getGridCoordinates(e.clientX, e.clientY);
      const color = refs.activeButton.current === 0
        ? (state.tool === 'eraser' ? null : state.color)
        : null;

      handleDraw(gridX, gridY, color, state);
      updateCanvasDisplay();
    }
  }, [stateRef, refs.isPanning, refs.panStart, refs.isInteracting, refs.activeButton, containerRef, getGridCoordinates, handleDraw, updateCanvasDisplay, drawPreviewLine]);

  const handleEnd = useCallback((e: PointerEvent) => {
    if (refs.isDrawingLine.current && refs.lineStart.current) {
      const state = stateRef.current;
      const startPos = getGridCoordinates(refs.lineStart.current.clientX, refs.lineStart.current.clientY);
      const endPos = getGridCoordinates(e.clientX, e.clientY);
      handleDrawLine(
        startPos.gridX,
        startPos.gridY,
        endPos.gridX,
        endPos.gridY,
        state.color,
        state
      );
      
      // Limpiar la vista previa
      if (refs.previewCtx.current) {
        refs.previewCtx.current.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
      }

      // Restablecer lastDrawnPixelRef al finalizar la línea
      refs.lastDrawnPixel.current = null;
    }
    refs.isDrawingLine.current = false;
    refs.lineStart.current = null;
    if (refs.isInteracting.current) {
      refs.isInteracting.current = false;
      refs.activeButton.current = null;
      refs.lastDrawnPixel.current = null;
      if (refs.currentStroke.current.length > 0) {
        saveState(refs.currentStroke.current);
        updateCanvasDisplay();
      }
      refs.currentStroke.current = [];
    }
    if (refs.isPanning.current) {
      refs.isPanning.current = false;
      refs.panStart.current = null;
    }
  }, [refs.lineStart, getGridCoordinates, handleDrawLine, saveState, updateCanvasDisplay, canvasRef]);

  const handleInteraction = useCallback((e: PointerEvent) => {
    const state = stateRef.current;
    if (state.tool !== 'move') e.preventDefault();

    const handlers: Record<string, (e: PointerEvent) => void> = {
      pointerdown: (event: PointerEvent) => handleStart(event),
      pointermove: (event: PointerEvent) => handleMove(event),
      pointerup: (event: PointerEvent) => handleEnd(event),
      pointercancel: (event: PointerEvent) => handleEnd(event)
    };

    handlers[e.type]?.(e);
  }, [handleStart, handleMove, handleEnd, stateRef]);

  return handleInteraction;
};

export default useHandleInteraction;