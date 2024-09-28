import { State, Frame, Layer } from '../types/types';

const STATE_CACHE_KEY = 'pixelArtAppState';

export const saveStateToCache = (state: State) => {
  try {
    const stateToSave = {
      ...state,
      frames: state.frames.map(frame => ({
        ...frame,
        layers: frame.layers.map(layer => ({
          ...layer,
          pixels: Array.from(layer.pixels.entries()), // Convertir Map a Array
        })),
      })),
    };
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem(STATE_CACHE_KEY, serializedState);
  } catch (error) {
    console.error('Error saving state to cache:', error);
  }
};

export const loadStateFromCache = (): State | undefined => {
  try {
    const serializedState = localStorage.getItem(STATE_CACHE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    const parsedState = JSON.parse(serializedState);

    return {
      ...parsedState,
      frames: parsedState.frames.map((frame: Frame) => ({
        ...frame,
        layers: frame.layers.map((layer: Layer) => ({
          ...layer,
          pixels: new Map(layer.pixels), // Convertir Array a Map
        })),
      })),
    } as State;
  } catch (error) {
    console.error('Error loading state from cache:', error);
    return undefined;
  }
};

export const clearCache = () => {
  localStorage.removeItem(STATE_CACHE_KEY);
};