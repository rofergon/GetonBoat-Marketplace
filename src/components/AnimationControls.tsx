/* eslint-disable no-unused-vars */
import React, { useState, useCallback } from 'react';
import { Plus, Play, Pause, SkipForward, SkipBack, Download } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import FrameThumbnail from './FrameThumbnail';
import { State, Frame } from '../types/types';
import { useExportGif } from '../hooks/useExportGif';
import { useAnimationControl } from '../hooks/useAnimationControl';
import { useAnimationStatus } from '../hooks/useAnimationStatus';
import { useMediaQuery } from 'react-responsive';

interface AnimationControlsProps {
  state: State;
  fps: number;
  setFps: React.Dispatch<React.SetStateAction<number>>;
  updateState: (newState: Partial<State> | ((prevState: State) => Partial<State>)) => void;
  saveState: () => void;
  updateCanvasDisplay: () => void;
  day: number;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  state,
  fps,
  setFps,
  updateState,
  saveState,
  updateCanvasDisplay,
  day,
}) => {
  const { isPlaying, setIsPlaying, changeFrame } = useAnimationControl(state, fps, updateState, updateCanvasDisplay);
  const { exportGif } = useExportGif(state, fps);
  const [showFrames, setShowFrames] = useState(true);
  const { seconds, frame } = useAnimationStatus(day);

  const addFrame = () => {
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
  };

  const deleteFrame = (index: number) => {
    if (state.frames.length > 1) {
      updateState(prev => ({
        frames: prev.frames.filter((_, i) => i !== index),
        currentFrameIndex: Math.min(prev.currentFrameIndex, prev.frames.length - 2),
      }));
      saveState();
      updateCanvasDisplay();
    }
  };

  const handleFrameSelect = useCallback((index: number) => {
    updateState({ currentFrameIndex: index });
    updateCanvasDisplay();
  }, [updateState, updateCanvasDisplay]);

  const buttonStyle = "w-9 h-9 p-2 bg-[#1f2a37] text-[#6b7280] hover:bg-[#374151] hover:text-[#9ca3af] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";

  const isLargeScreen = useMediaQuery({ minWidth: 1024 });

  const renderControls = () => (
    <div className="flex items-center justify-between gap-2 mb-2">
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
        {isLargeScreen && (
          <>
            <div className="flex items-center space-x-2 ml-4">
              <Slider
                min={1} max={30} step={1} value={[fps]}
                onValueChange={value => setFps(value[0])}
                className="w-32"
              />
              <span className="text-sm font-medium">{fps} FPS</span>
            </div>
            <div className="flex items-center gap-2 font-roboto ml-4">
              <span className="flex items-center gap-1 text-red-600 animate-pulse">
                REC
                <svg viewBox="0 0 2 2" className="h-3 w-3 fill-current">
                  <circle cx={1} cy={1} r={1} />
                </svg>
              </span>
              00:{seconds.toString().padStart(2, '0')}.{frame.toString().padStart(2, '0')}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {!isLargeScreen && (
          <div className="flex items-center gap-2 font-roboto text-xs mr-2">
            <span className="flex items-center gap-1 text-red-600 animate-pulse">
              REC
              <svg viewBox="0 0 2 2" className="h-2 w-2 fill-current">
                <circle cx={1} cy={1} r={1} />
              </svg>
            </span>
            00:{seconds.toString().padStart(2, '0')}.{frame.toString().padStart(2, '0')}
          </div>
        )}
        <Button onClick={exportGif} className={`${buttonStyle} flex`}>
          <Download className="w-full h-full" />
        </Button>
        <Switch
          checked={showFrames}
          onCheckedChange={setShowFrames}
          className="data-[state=checked]:bg-blue-500"
        />
        <span className="text-sm hidden sm:inline">Show Frames</span>
      </div>
    </div>
  );

  return (
    <div className="p-2 bg-gray-800 text-gray-200">
      {renderControls()}
      {showFrames && (
        <div className="overflow-x-auto whitespace-nowrap mt-2 w-full">
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
      )}
    </div>
  );
};

export default AnimationControls;