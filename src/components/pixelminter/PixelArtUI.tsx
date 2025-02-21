/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import ToolPanel from './ToolPanel';
import { State, BrushData, Feedback } from '../../types/types';
import CanvasComponent from './CanvasComponent';
import AnimationControls from './AnimationControls';
import ReferenceImage from './ReferenceImage';

interface PixelArtUIProps {
  state: State;
  containerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gridCanvasRef: React.RefObject<HTMLCanvasElement>;
  updateState: (newState: Partial<State> | ((prevState: State) => Partial<State>)) => void;
  feedback: Feedback;
  handleHistoryAction: (action: 'undo' | 'redo') => void;
  updateCanvasDisplay: () => void;
  saveState: () => void;
  drawGrid: () => void;
  handleExtractPalette: () => void;
  handleZoom: (zoomIn: boolean) => void;
  clearCanvas: () => void;
  onGridSizeChange: (newSize: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  syncPixelGridWithCurrentFrame: () => void;
  handleShiftFrame: (direction: 'left' | 'right' | 'up' | 'down') => void;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayerVisibility: (id: string, visible: boolean) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  setActiveLayerId: (id: string) => void;
  updateLayerName: (id: string, name: string) => void;
  brushData: BrushData | null;
  updateBrushData: (data: BrushData | null) => void;
  updateDay: () => Promise<void>;
  toggleOnionSkinning: () => void;
  updateOnionSkinningOpacity: (opacity: number) => void;
  onionSkinningCanvas: React.RefObject<HTMLCanvasElement>;
  day: number;
}

const PixelArtUI: React.FC<PixelArtUIProps> = ({
  state,
  containerRef,
  canvasRef,
  gridCanvasRef,
  updateState,
  feedback,
  handleHistoryAction,
  updateCanvasDisplay,
  saveState,
  drawGrid,
  handleExtractPalette,
  handleZoom,
  clearCanvas,
  onGridSizeChange,
  canUndo,
  canRedo,
  syncPixelGridWithCurrentFrame,
  handleShiftFrame,
  addLayer,
  removeLayer,
  updateLayerVisibility,
  updateLayerOpacity,
  setActiveLayerId,
  updateLayerName,
  brushData,
  updateBrushData,
  updateDay,
  toggleOnionSkinning,
  updateOnionSkinningOpacity,
  onionSkinningCanvas,
  day
}) => {
  const [fps, setFps] = useState(30);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showFrames, setShowFrames] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const canvasStyle = isClient
    ? {
        width: `${state.canvasSize * state.zoom}px`,
        height: `${state.canvasSize * state.zoom}px`,
        margin: 'auto',
      }
    : { width: '100%', height: '100%', margin: 'auto' };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          handleShiftFrame('left');
          break;
        case 'ArrowRight':
          handleShiftFrame('right');
          break;
        case 'ArrowUp':
          handleShiftFrame('up');
          break;
        case 'ArrowDown':
          handleShiftFrame('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleShiftFrame]);

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] text-gray-500">
      <div className="flex flex-1 overflow-hidden relative">
        <ToolPanel
          state={state}
          updateState={updateState}
          handleHistoryAction={handleHistoryAction}
          clearCanvas={clearCanvas}
          handleZoom={handleZoom}
          feedback={feedback}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 relative`}>
          <CanvasComponent
            state={state}
            containerRef={containerRef}
            canvasRef={canvasRef}
            gridCanvasRef={gridCanvasRef}
            updateState={updateState}
            saveState={saveState}
            canvasStyle={canvasStyle}
            drawGrid={drawGrid}
            updateCanvasDisplay={updateCanvasDisplay}
            onionSkinningCanvas={onionSkinningCanvas}
            toggleOnionSkinning={toggleOnionSkinning}
            updateOnionSkinningOpacity={updateOnionSkinningOpacity}
          />
          <button
            onClick={toggleSidePanel}
            className="p-1 bg-muted hover:bg-muted focus:outline-none rounded absolute bottom-3 z-50"
            title="Toggle Side Panel"
            style={{
              width: '32px',
              height: '32px',
              left: isSidePanelOpen ? 'auto' : 'calc(100% - 15px)',
              right: isSidePanelOpen ? '-22px' : 'auto',
              transition: 'left 0.3s ease-in-out, right 0.3s ease-in-out',
            }}
          >
          </button>
        </div>

        <div
          className={`transition-all duration-300 relative ${
            isSidePanelOpen ? 'w-72' : 'w-0'
          } overflow-hidden`}
        >
          <SidePanel
            state={state}
            updateState={updateState}
            handleExtractPalette={handleExtractPalette}
            onGridSizeChange={onGridSizeChange}
            isExporting={false}
            addLayer={addLayer}
            removeLayer={removeLayer}
            updateLayerVisibility={updateLayerVisibility}
            updateLayerOpacity={updateLayerOpacity}
            setActiveLayerId={setActiveLayerId}
            updateLayerName={updateLayerName}
            brushData={brushData}
            updateBrushData={updateBrushData}
            toggleOnionSkinning={toggleOnionSkinning}
            updateOnionSkinningOpacity={updateOnionSkinningOpacity}
            onionSkinningCanvas={onionSkinningCanvas}
            fps={fps}
            setFps={setFps}
            showFrames={showFrames}
            setShowFrames={setShowFrames}
          />
        </div>
      </div>

      <div className="w-full">
        <AnimationControls
          state={state}
          fps={fps}
          setFps={setFps}
          updateState={updateState}
          saveState={saveState}
          updateCanvasDisplay={updateCanvasDisplay}
          day={day}
          showFrames={showFrames}
        />
      </div>

      {state.showReferenceImage && (
        <ReferenceImage
          url={state.referenceImageUrl}
          position={state.referenceImagePosition}
          size={state.referenceImageSize}
          onPositionChange={(position) => updateState({ referenceImagePosition: position })}
          onSizeChange={(size) => updateState({ referenceImageSize: size })}
          onUrlChange={(url) => updateState({ referenceImageUrl: url })}
        />
      )}

      <div
        className="absolute inset-0 z-40 pointer-events-none"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (canvasRect) {
              const x = e.clientX - canvasRect.left;
              const y = e.clientY - canvasRect.top;
              const event = new PointerEvent('pointerdown', {
                clientX: x,
                clientY: y,
                bubbles: true,
              });
              canvasRef.current?.dispatchEvent(event);
            }
          }
        }}
        onPointerMove={(e) => {
          if (state.isDrawing) {
            e.preventDefault();
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            if (canvasRect) {
              const x = e.clientX - canvasRect.left;
              const y = e.clientY - canvasRect.top;
              const event = new PointerEvent('pointermove', {
                clientX: x,
                clientY: y,
                bubbles: true,
              });
              canvasRef.current?.dispatchEvent(event);
            }
          }
        }}
        onPointerUp={(e) => {
          if (state.isDrawing) {
            e.preventDefault();
            const event = new PointerEvent('pointerup', {
              bubbles: true,
            });
            canvasRef.current?.dispatchEvent(event);
          }
        }}
      />
    </div>
  );
};

export default PixelArtUI;