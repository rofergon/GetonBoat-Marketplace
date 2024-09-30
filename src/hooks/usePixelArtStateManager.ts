/* eslint-disable no-unused-vars */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { State, Frame, Layer, HistoryEntry } from '../types/types';
import { loadStateFromCache } from '../utils/cacheState';
import * as LayerManager from './layerStateManager';
import { v4 as uuidv4 } from 'uuid';
import { calculateDay } from '../utils/dateUtils';

const usePixelArtStateManager = () => {
  const canvasSize = 1280;
  const cachedState = useMemo(loadStateFromCache, []);

  const initialState: State = useMemo(() => {
    const defaultLayer: Layer = { id: uuidv4(), name: 'Layer 1', pixels: new Map(), visible: true, opacity: 1 };
    const defaultFrame: Frame = { layers: [defaultLayer], history: [], historyIndex: -1 };
    const gridSize = 16;

    if (cachedState) {
      return {
        ...cachedState,
        canvasSize,
        frames: cachedState.frames.length > 0 ? cachedState.frames : [defaultFrame],
        currentFrameIndex: Math.min(cachedState.currentFrameIndex, cachedState.frames.length - 1),
        gridSize: cachedState.gridSize || gridSize,
        touchEnabled: cachedState.touchEnabled || false,
        activeLayerId: cachedState.activeLayerId || defaultLayer.id,
        brushData: cachedState.brushData || null,
        pixelsPerDay: cachedState.pixelsPerDay || 0,
        day: null,
        onionSkinning: true,
        onionSkinningOpacity: 0.5,
        backgroundOpacity: cachedState.backgroundOpacity || 1,
        showReferenceImage: cachedState.showReferenceImage || false,
        referenceImageUrl: cachedState.referenceImageUrl || '',
        referenceImagePosition: cachedState.referenceImagePosition || { x: 0, y: 0 },
        referenceImageSize: cachedState.referenceImageSize || { width: 340, height: 460 },
        fps: cachedState.fps || 30, // Añadimos esta línea
      };
    }

    return {
      showBackgroundImage: true,
      color: '#000000',
      isDrawing: false,
      tool: 'brush',
      canvasSize,
      gridSize,
      showGrid: true,
      scale: 1,
      palette: [],
      theme: '',
      dailyImageUrl: '',
      isPaletteLoading: false,
      frames: [defaultFrame],
      currentFrameIndex: 0,
      zoom: 0.8,
      activeTab: 'draw',
      customPalette: [],
      touchEnabled: false,
      activeLayerId: defaultLayer.id,
      brushData: null,
      pixelsPerDay: 0,
      day: null,
      onionSkinning: true,
      onionSkinningOpacity: 0.5,
      backgroundOpacity: 1,
      showReferenceImage: false,
      referenceImageUrl: '',
      referenceImagePosition: { x: 0, y: 0 },
      referenceImageSize: { width: 340, height: 460 },
      fps: 30, // Valor inicial para FPS
    };
  }, [cachedState, canvasSize]);

  const [state, setState] = useState<State>(initialState);

  const updateState = useCallback((newState: Partial<State> | ((prev: State) => Partial<State>)) => {
    setState(prev => {
      const updatedState = { ...prev, ...(typeof newState === 'function' ? newState(prev) : newState) };
      return updatedState;
    });
  }, []);

  const updateFrames = useCallback((updater: (frames: Frame[]) => Frame[]) => {
    updateState(prev => ({ frames: updater(prev.frames) }));
  }, [updateState]);

  const updateCurrentFrame = useCallback((updater: (frame: Frame) => Frame) => {
    updateFrames(frames => frames.map((frame, index) => index === state.currentFrameIndex ? updater(frame) : frame));
  }, [updateFrames, state.currentFrameIndex]);

  const layerActions = useMemo(() => ({
    addLayer: () => updateState(prev => LayerManager.addLayer(prev)),
    removeLayer: (layerId: string) => updateState(prev => LayerManager.removeLayer(prev, layerId)),
    updateLayerVisibility: (layerId: string, visible: boolean) => updateState(prev => LayerManager.updateLayerVisibility(prev, layerId, visible)),
    updateLayerOpacity: (layerId: string, opacity: number) => updateState(prev => LayerManager.updateLayerOpacity(prev, layerId, opacity)),
    setActiveLayerId: (layerId: string) => updateState({ activeLayerId: layerId }),
    updateLayerName: (layerId: string, newName: string) => {
      updateState(prev => {
        const frames = [...prev.frames];
        const layerIndex = frames[prev.currentFrameIndex].layers.findIndex(layer => layer.id === layerId);
        if (layerIndex !== -1) {
          frames[prev.currentFrameIndex].layers[layerIndex].name = newName;
        }
        return { frames };
      });
    },
  }), [updateState]);

  const pixelActions = useMemo(() => ({
    updatePixel: (x: number, y: number, color: string | null) => {
      updateCurrentFrame(frame => ({
        ...frame,
        layers: frame.layers.map(layer =>
          layer.id === state.activeLayerId
            ? { ...layer, pixels: updatePixelMap(layer.pixels, x, y, color) }
            : layer
        )
      }));
    },
    saveState: (frameIndex: number, changes?: [string, string][]) => {
      if (!changes?.length) return;
      updateFrames(frames => frames.map((frame, index) =>
        index === frameIndex ? {
          ...frame,
          history: [...frame.history.slice(0, frame.historyIndex + 1), { frameIndex, layerId: state.activeLayerId, changes, type: 'pixel' }],
          historyIndex: frame.historyIndex + 1
        } : frame
      ));
    },
    undo: () => {
      updateCurrentFrame(frame => {
        if (frame.historyIndex < 0) return frame;
        const entry = frame.history[frame.historyIndex];
        return {
          ...frame,
          layers: frame.layers.map(layer =>
            layer.id === entry.layerId
              ? { ...layer, pixels: undoPixelChanges(layer.pixels, entry.changes, frame.history, frame.historyIndex - 1) }
              : layer
          ),
          historyIndex: frame.historyIndex - 1
        };
      });
    },
    redo: () => {
      updateCurrentFrame(frame => {
        if (frame.historyIndex >= frame.history.length - 1) return frame;
        const entry = frame.history[frame.historyIndex + 1];
        return {
          ...frame,
          layers: frame.layers.map(layer =>
            layer.id === entry.layerId
              ? { ...layer, pixels: redoPixelChanges(layer.pixels, entry.changes) }
              : layer
          ),
          historyIndex: frame.historyIndex + 1
        };
      });
    },
    clearCanvas: () => {
      updateCurrentFrame(frame => ({
        ...frame,
        layers: frame.layers.map(layer => ({ ...layer, pixels: new Map() })),
        history: [],
        historyIndex: -1
      }));
    },
    syncPixelGrid: () => {
      updateState(prev => {
        const currentFrame = prev.frames[prev.currentFrameIndex];
        const updatedLayers = currentFrame.layers.map(layer => layer.visible ? { ...layer, pixels: new Map(layer.pixels) } : layer);
        const frames = prev.frames.map((frame, index) => index === prev.currentFrameIndex ? { ...frame, layers: updatedLayers } : frame);
        return { frames };
      });
    },
  }), [updateCurrentFrame, updateFrames, state.activeLayerId, updateState]);

  const fpsActions = useMemo(() => ({
    setFps: (newFps: number) => updateState({ fps: newFps }),
  }), [updateState]);

  const syncPixelGridWithCurrentFrame = () => {
    // Implementa la lógica necesaria
  };

  const canUndo = useMemo(() => state.frames[state.currentFrameIndex].historyIndex >= 0, [state.frames, state.currentFrameIndex]);
  const canRedo = useMemo(() => state.frames[state.currentFrameIndex].historyIndex < state.frames[state.currentFrameIndex].history.length - 1, [state.frames, state.currentFrameIndex]);

  const updateDay = useCallback(async () => {
    try {
      const calculatedDay = await calculateDay();
      updateState({ day: calculatedDay });
    } catch (error) {
      console.error('Error al calcular el día:', error);
    }
  }, [updateState]);

  const toggleOnionSkinning = useCallback(() => {
    updateState(prevState => ({ onionSkinning: !prevState.onionSkinning }));
  }, [updateState]);

  const updateOnionSkinningOpacity = useCallback((opacity: number) => {
    updateState({ onionSkinningOpacity: opacity });
  }, [updateState]);

  useEffect(() => {
    updateDay();
  }, [updateDay]);

  return {
    state,
    updateState,
    ...layerActions,
    ...pixelActions,
    ...fpsActions, // Añadimos las acciones de FPS
    canUndo,
    canRedo,
    syncPixelGridWithCurrentFrame,
    updateDay,
    toggleOnionSkinning,
    updateOnionSkinningOpacity,
  };
};

// Funciones auxiliares
const updatePixelMap = (pixels: Map<string, string>, x: number, y: number, color: string | null) => {
  const newPixels = new Map(pixels);
  const key = `${x},${y}`;
  color ? newPixels.set(key, color) : newPixels.delete(key);
  return newPixels;
};

const undoPixelChanges = (pixels: Map<string, string>, changes: [string, string][], history: HistoryEntry[], historyIndex: number) => {
  const newPixels = new Map(pixels);
  changes.forEach(([key]) => {
    const prevColor = findPreviousColor(history, historyIndex, key);
    prevColor ? newPixels.set(key, prevColor) : newPixels.delete(key);
  });
  return newPixels;
};

const redoPixelChanges = (pixels: Map<string, string>, changes: [string, string][]) => {
  const newPixels = new Map(pixels);
  changes.forEach(([key, color]) => {
    color ? newPixels.set(key, color) : newPixels.delete(key);
  });
  return newPixels;
};

const findPreviousColor = (history: HistoryEntry[], currentIndex: number, key: string): string | null => {
  for (let i = currentIndex; i >= 0; i--) {
    const change = history[i].changes.find(([k]) => k === key);
    if (change) return change[1];
  }
  return null;
};

export default usePixelArtStateManager;