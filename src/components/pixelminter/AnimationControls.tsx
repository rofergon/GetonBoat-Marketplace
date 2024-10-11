/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import FrameThumbnail from './FrameThumbnail';
import { State, Frame } from '../../types/types';
import { useExportGif } from '../../hooks/useExportGif';
import { useAnimationControl } from '../../hooks/useAnimationControl';
import { useAnimationStatus } from '../../hooks/useAnimationStatus';
import { useMediaQuery } from 'react-responsive';

interface AnimationControlsProps {
  state: State;
  fps: number;
  setFps: (fps: number) => void;
  updateState: (newState: Partial<State> | ((prevState: State) => Partial<State>)) => void;
  saveState: () => void;
  updateCanvasDisplay: () => void;
  day: number;
  showFrames: boolean;
}

const AnimationControls: React.FC<AnimationControlsProps> = React.memo(({
  state,
  fps,
  updateState,
  saveState,
  updateCanvasDisplay,
  day,
  showFrames,
}) => {
  const { isPlaying, setIsPlaying, changeFrame } = useAnimationControl(state, fps, updateState, updateCanvasDisplay);
  const { exportGif, isExporting } = useExportGif(state, fps);
  const { seconds, frame } = useAnimationStatus(day);

  const addFrame = useCallback(() => {
    updateState(prev => {
      const newFrame: Frame = {
        layers: prev.frames[prev.currentFrameIndex].layers.map(layer => ({
          ...layer,
          pixels: new Map(layer.pixels)
        })),
        history: [],
        historyIndex: -1
      };
      const newFrames = [...prev.frames.slice(0, prev.currentFrameIndex + 1), newFrame, ...prev.frames.slice(prev.currentFrameIndex + 1)];
      return { frames: newFrames, currentFrameIndex: prev.currentFrameIndex + 1 };
    });
    saveState();
    updateCanvasDisplay();
  }, [updateState, saveState, updateCanvasDisplay]);

  const deleteFrame = useCallback((index: number) => {
    if (state.frames.length > 1) {
      updateState(prev => ({
        frames: prev.frames.filter((_, i) => i !== index),
        currentFrameIndex: Math.min(prev.currentFrameIndex, prev.frames.length - 2),
      }));
      saveState();
      updateCanvasDisplay();
    }
  }, [state.frames.length, updateState, saveState, updateCanvasDisplay]);

  const handleFrameSelect = useCallback((index: number) => {
    updateState({ currentFrameIndex: index });
    updateCanvasDisplay();
  }, [updateState, updateCanvasDisplay]);

  const buttonStyle = useMemo(() => "btn-tool bg-muted", []);

  const renderControls = useMemo(() => (
    <div className="flex items-center justify-between gap-2 bg-muted">
      <div className="flex items-center space-x-2">
        <Button onClick={addFrame} className={`${buttonStyle} flex`}>
          <Plus className="w-full h-full" />
        </Button>
        <Button onClick={() => setIsPlaying(!isPlaying)} className={buttonStyle}>
          {isPlaying ? <Pause className="w-full h-full" /> : <Play className="w-full h-full" />}
        </Button>
        <Button
          onClick={() => changeFrame((state.currentFrameIndex - 1 + state.frames.length) % state.frames.length)}
          disabled={state.frames.length <= 1}
          className={buttonStyle}
          title="Previous Frame"
        >
          <SkipBack className="w-full h-full" />
        </Button>
        <Button
          onClick={() => changeFrame((state.currentFrameIndex + 1) % state.frames.length)}
          disabled={state.frames.length <= 1}
          className={buttonStyle}
          title="Next Frame"
        >
          <SkipForward className="w-full h-full" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-2 font-roboto text-xs mr-2">
          <span className="flex items-center gap-1 text-red-600 animate-pulse">
            REC
            <svg viewBox="0 0 2 2" className="h-2 w-2 fill-current">
              <circle cx={1} cy={1} r={1} />
            </svg>
          </span>
          <span className="text-sm">00:{seconds.toString().padStart(2, '0')}.{frame.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  ), [isPlaying, setIsPlaying, changeFrame, state.frames.length, state.currentFrameIndex, fps, seconds, frame]);

  const renderFrameThumbnails = useMemo(() => (
    <div className="overflow-x-auto whitespace-nowrap p-2 pb-1 w-full">
      {state.frames.map((frame, index) => (
        <FrameThumbnail
          key={index}
          frame={frame}
          index={index}
          state={state}
          updateState={updateState}
          onDelete={() => deleteFrame(index)}
          canDelete={state.frames.length > 1}
          onFrameSelect={handleFrameSelect}
        />
      ))}
    </div>
  ), [state.frames, state, updateState, deleteFrame, handleFrameSelect]);

  return (
    <div className="border-t border-background">
      {renderControls}
      {showFrames && renderFrameThumbnails}
    </div>
  );
});

AnimationControls.displayName = 'AnimationControls';

export default AnimationControls;